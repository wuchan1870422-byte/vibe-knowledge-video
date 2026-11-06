"""原仓库QA按原逻辑运行；只给select静帧输出加VFR，避免FFmpeg复制补帧。"""
from pathlib import Path
import subprocess,runpy,sys
R=Path(__file__).resolve().parent;original=subprocess.run
# FFmpeg支持的输出选项，不改变断言、阈值或采样时刻。
def run(args,*a,**kw):
 if isinstance(args,list) and args and args[0]=='ffmpeg' and '-vf' in args and 'select=' in args[args.index('-vf')+1]:
  args=args[:-1]+['-fps_mode','vfr']+args[-1:]
 return original(args,*a,**kw)
subprocess.run=run
sys.argv=[str(R.parents[1]/'scripts/qa_check.py'),str(R/'delivery/final.mp4'),'--sample','16']
runpy.run_path(sys.argv[0],run_name='__main__')
