import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
os.chdir('backend-minier')
exec(open('app.py').read(), {'__name__':'__main__'})
