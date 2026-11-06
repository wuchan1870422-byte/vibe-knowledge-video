// 真实局部Boids积分器。无全局中心/目标/预制轨迹；空间网格仅加速邻居查找。
// 相机不在此程序中，回放缓存由以下动力学计算产生。
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>
struct V {
 double x=0,y=0,z=0;
 V operator+(V b)const{return{x+b.x,y+b.y,z+b.z};}
 V operator-(V b)const{return{x-b.x,y-b.y,z-b.z};}
 V operator*(double a)const{return{x*a,y*a,z*a};}
 V operator/(double a)const{return *this*(1/a);}
 V& operator+=(V b){x+=b.x;y+=b.y;z+=b.z;return *this;}
};
double dot(V a,V b){return a.x*b.x+a.y*b.y+a.z*b.z;}
double norm(V a){return std::sqrt(dot(a,a));}
V unit(V a){double n=norm(a);return n>1e-10?a/n:V{0,0,0};}
V cap(V a,double m){double n=norm(a);return n>m?a*(m/n):a;}
V cross(V a,V b){return{a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x};}
constexpr int N=3200,K=16,HZ=60,STRIDE=8;
constexpr double DT=1.0/HZ,R=8.5,SEP=2.4,MAXACC=12,MAXTURN=.9;
constexpr double WARMUP=20,DURATION=125;
constexpr int NX=23,NY=17,NZ=19;
constexpr double CELL=R,ORIGIN=96;
int focusID=0;
uint32_t rngstate=20261107;
double random01(){rngstate^=rngstate<<13;rngstate^=rngstate>>17;rngstate^=rngstate<<5;return (rngstate>>8)*(1.0/16777216.0);}
struct Agent {V p,v;double turn=0;};
struct Neighbor {double d;int id;};
struct World {
 std::vector<Agent>a=std::vector<Agent>(N),next=a;
 std::vector<int>head=std::vector<int>(NX*NY*NZ,-1),link=std::vector<int>(N,-1);
 double minObstacle=1e9,maxSpeed=0,minSpeed=1e9,maxAccel=0,maxAngular=0,maxRho=0;
 long long queries=0,candidates=0;
 bool obstacleEnabled=true;
 V obstacleTarget{0,0,0};
 int coordinate(double x,int n)const{return std::clamp(int(std::floor((x+ORIGIN)/CELL)),0,n-1);}
 int index(int x,int y,int z)const{return(x*NY+y)*NZ+z;}
 void grid(){std::fill(head.begin(),head.end(),-1);for(int i=0;i<N;i++){V p=a[i].p;int h=index(coordinate(p.x,NX),coordinate(p.y,NY),coordinate(p.z,NZ));link[i]=head[h];head[h]=i;}}
 int neighbors(int i,std::array<Neighbor,K>&out){
  V p=a[i].p;int x=coordinate(p.x,NX),y=coordinate(p.y,NY),z=coordinate(p.z,NZ),n=0;double far=R*R;int worst=0;
  for(int dx=std::max(x-1,0);dx<=std::min(x+1,NX-1);dx++)for(int dy=std::max(y-1,0);dy<=std::min(y+1,NY-1);dy++)for(int dz=std::max(z-1,0);dz<=std::min(z+1,NZ-1);dz++){
   for(int j=head[index(dx,dy,dz)];j!=-1;j=link[j]){if(j==i)continue;candidates++;double d=dot(a[j].p-p,a[j].p-p);if(d>=R*R||d<1e-14)continue;
    if(n<K){out[n++]={d,j};if(n==K){worst=0;for(int k=1;k<K;k++)if(out[k].d>out[worst].d)worst=k;far=out[worst].d;}}
    else if(d<far){out[worst]={d,j};worst=0;for(int k=1;k<K;k++)if(out[k].d>out[worst].d)worst=k;far=out[worst].d;}
   }
  }queries++;return n;
 }
 V obstacle(double videoTime)const{
  // 外部环境：球体在88–91秒从上方进入前方，106–110秒退出。
  double lift=videoTime<88?60:videoTime<91?60*(1-(videoTime-88)/3):videoTime<106?0:std::min(60.,(videoTime-106)*15);
  return obstacleTarget+V{0,lift,0};
 }
 void init(){
  for(int i=0;i<N;i++){
   V p;bool valid=false;
   while(!valid){V u{random01()*2-1,random01()*2-1,random01()*2-1};if(dot(u,u)>1)continue;p={u.x*29-24,u.y*17,u.z*22};valid=true;for(int j=0;j<i;j++)if(dot(p-a[j].p,p-a[j].p)<1.15*1.15){valid=false;break;}}
   a[i]={p,unit({1.,(random01()-.5)*.45,(random01()-.5)*.55})*(8.5+random01()*1.6),0};
  }
 }
 void step(double videoTime){
  grid();V ob=obstacle(videoTime);
  for(int i=0;i<N;i++){
   Agent old=a[i];std::array<Neighbor,K> ns;int n=neighbors(i,ns);V separation{},alignment{},cohesion{};
   if(n){V pos{},vel{};for(int j=0;j<n;j++){Agent b=a[ns[j].id];pos+=b.p;vel+=b.v;if(ns[j].d<SEP*SEP){double d=std::sqrt(ns[j].d);separation+=(old.p-b.p)*(std::pow(1-d/SEP,1.2)/std::max(d,.1));}}
    separation=cap(separation*17,11);alignment=cap((vel/double(n)-old.v)*1.35,6);cohesion=cap((pos/double(n)-old.p)*.48,3.1);
   }
   V force=separation+alignment+cohesion;
   // 环境的软椭球边界，不参与任何邻居统计，也不是群体共享目标。
   V predicted=old.p+old.v*1.8;double rho=std::sqrt(std::pow(predicted.x/72,2)+std::pow(predicted.y/45,2)+std::pow(predicted.z/52,2));
   if(rho>.84){V normal=unit({predicted.x/(72*72),predicted.y/(45*45),predicted.z/(52*52)});force+=normal*(-std::min(18.,(rho-.84)*65));}
   force+=unit(old.v)*((9.1-norm(old.v))*.55);
   if(obstacleEnabled&&videoTime>=88&&videoTime<112){
    V dir=unit(old.v),rel=ob-old.p;double ahead=dot(rel,dir);V lateral=old.p+dir*ahead-ob;double side=norm(lateral);
    // 局部前视：只响应自身3.8秒内可能撞上的球体。
    if(ahead>-2&&ahead<norm(old.v)*3.8&&side<10.0){
     V away=side>.02?lateral/side:unit(cross(dir,{0,1,0}));
     if(norm(away)<.1)away={0,0,1};
     double urgency=std::clamp((38-ahead)/24,0.0,1.0);
     V avoid=away*(16*urgency)+dir*(-3*urgency);force+=avoid;
    }
    double dist=norm(old.p-ob);if(dist<12){force+=unit(old.p-ob)*((12-dist)*7);}
   }
   force=cap(force,MAXACC);V nv=old.v+force*DT;double speed=std::clamp(norm(nv),6.5,11.5);V from=unit(old.v),to=unit(nv);double cosine=std::clamp(dot(from,to),-1.,1.);double angle=std::acos(cosine);
   if(angle>MAXTURN*DT){V side=unit(to-from*cosine);if(norm(side)<.01)side=unit(cross(from,{0,1,0}));to=from*std::cos(MAXTURN*DT)+side*std::sin(MAXTURN*DT);angle=MAXTURN*DT;}
   nv=to*speed;V np=old.p+(old.v+nv)*(.5*DT);next[i]={np,nv,angle/DT};
   if(videoTime>=0){maxSpeed=std::max(maxSpeed,speed);minSpeed=std::min(minSpeed,speed);maxAccel=std::max(maxAccel,norm(nv-old.v)/DT);maxAngular=std::max(maxAngular,angle/DT);maxRho=std::max(maxRho,std::sqrt(std::pow(np.x/72,2)+std::pow(np.y/45,2)+std::pow(np.z/52,2)));if(obstacleEnabled&&videoTime>=88&&videoTime<112)minObstacle=std::min(minObstacle,norm(np-obstacle(videoTime+DT))-7.0);}
  }a.swap(next);
 }
 V center()const{V c{};for(auto b:a)c+=b.p;return c/double(N);}
};
void writeFocus(World&w,std::ofstream&f){
 w.grid();std::array<Neighbor,K>ns;int n=w.neighbors(focusID,ns);std::array<float,(K+1)*8>data;
 for(int k=0;k<=K;k++){int id=k==0?focusID:k<=n?ns[k-1].id:-1;int b=k*8;data[b]=float(id);if(id<0){for(int j=1;j<8;j++)data[b+j]=0;continue;}Agent a=w.a[id];data[b+1]=a.p.x;data[b+2]=a.p.y;data[b+3]=a.p.z;data[b+4]=a.v.x;data[b+5]=a.v.y;data[b+6]=a.v.z;data[b+7]=a.turn;}
 f.write(reinterpret_cast<char*>(data.data()),sizeof(data));
}
int main(int argc,char**argv){
 std::string dir=argc>1?argv[1]:"sim";bool scout=argc>2&&std::string(argv[2])=="--scout";World w;{std::ifstream f(dir+"/focus.txt");if(f)f>>focusID;}w.init();w.obstacleEnabled=!scout;
 if(!scout){std::ifstream f(dir+"/obstacle.txt");if(!f){std::cerr<<"Run --scout first, choose a fixed environmental obstacle location.\n";return 2;}f>>w.obstacleTarget.x>>w.obstacleTarget.y>>w.obstacleTarget.z;}
 std::ofstream replay,focus,path(dir+"/"+(scout?"scout.csv":"centers.csv"));
 if(!scout){replay.open(dir+"/replay.bin",std::ios::binary);focus.open(dir+"/focus.bin",std::ios::binary);}
 path<<"video_s,cx,cy,cz,vx,vy,vz,mean_turn,minx,maxx,miny,maxy,minz,maxz\n";
 int warm=std::lround(WARMUP*HZ),total=warm+7504,cached=0,focusFrames=0;
 for(int s=0;s<=total;s++){
  double t=(s-warm)*DT;
  if(s>=warm){
   if((s-warm)%STRIDE==0){
    if(!scout){std::vector<int16_t>data(N*7);for(int i=0;i<N;i++){auto b=w.a[i];auto q=[&](double v,double scale){return(int16_t)std::clamp(std::lround(v*scale),-32767L,32767L);};data[i*7]=q(b.p.x,128);data[i*7+1]=q(b.p.y,128);data[i*7+2]=q(b.p.z,128);data[i*7+3]=q(b.v.x,1024);data[i*7+4]=q(b.v.y,1024);data[i*7+5]=q(b.v.z,1024);data[i*7+6]=q(b.turn/MAXTURN,32767);}replay.write(reinterpret_cast<char*>(data.data()),data.size()*2);}cached++;
   }
   if(!scout&&s-warm<=7500){writeFocus(w,focus);focusFrames++;}
   if((s-warm)%60==0){V c=w.center(),v{};double turn=0;V lo{1e9,1e9,1e9},hi{-1e9,-1e9,-1e9};for(auto b:w.a){v+=b.v;turn+=b.turn;lo={std::min(lo.x,b.p.x),std::min(lo.y,b.p.y),std::min(lo.z,b.p.z)};hi={std::max(hi.x,b.p.x),std::max(hi.y,b.p.y),std::max(hi.z,b.p.z)};}v=v/double(N);path<<t<<','<<c.x<<','<<c.y<<','<<c.z<<','<<v.x<<','<<v.y<<','<<v.z<<','<<turn/N<<','<<lo.x<<','<<hi.x<<','<<lo.y<<','<<hi.y<<','<<lo.z<<','<<hi.z<<'\n';if(int(t)%10==0)std::cout<<(scout?"scout ":"main ")<<t<<"s center "<<c.x<<','<<c.y<<','<<c.z<<" turn "<<turn/N<<std::endl;}
  }w.step(t);
 }
 std::ofstream m(dir+"/"+(scout?"scout-metrics.json":"meta.json"));
 m<<"{\n\"count\":"<<N<<",\"duration\":125,\"step_hz\":60,\"cache_hz\":7.5,\"cache_frames\":"<<cached<<",\"focus_frames\":"<<focusFrames<<",\"focus_id\":"<<focusID<<",\"neighbor_radius\":"<<R<<",\"neighbor_cap\":"<<K<<",\"separation_radius\":"<<SEP<<",\"position_scale\":128,\"velocity_scale\":1024,\"max_turn_rad_s\":"<<MAXTURN<<",\"max_acceleration\":"<<MAXACC<<",\"observed_min_speed\":"<<w.minSpeed<<",\"observed_max_speed\":"<<w.maxSpeed<<",\"observed_max_acceleration\":"<<w.maxAccel<<",\"observed_max_turn_rad_s\":"<<w.maxAngular<<",\"observed_max_boundary_rho\":"<<w.maxRho<<",\"obstacle_radius\":7,\"obstacle_target\":["<<w.obstacleTarget.x<<','<<w.obstacleTarget.y<<','<<w.obstacleTarget.z<<"],\"minimum_obstacle_surface_distance\":"<<w.minObstacle<<",\"seed\":20261107,\"average_grid_candidates\":"<<double(w.candidates)/w.queries<<",\"rules\":[\"separation\",\"alignment\",\"cohesion\"],\"environment\":[\"soft ellipsoid boundary\",\"local anticipatory sphere avoidance at 88–112s\"],\"global_goal\":false,\"predefined_agent_trajectories\":false}\n";
}
