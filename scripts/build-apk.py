#!/usr/bin/env python3
"""Reproducible offline APK packaging with Android SDK, JDK 17, external signing key."""
import os,subprocess,zipfile,shutil
from pathlib import Path
root=Path(__file__).resolve().parent.parent
os.chdir(root)
sdk=Path(os.environ['ANDROID_JAR']);bt=Path(os.environ['BUILD_TOOLS'])
key=Path(os.environ['BUS_KEYSTORE']);alias=os.environ.get('BUS_KEY_ALIAS','bus');os.environ['BUS_KEY_PASSWORD']
out=root/'out/release';classes=out/'classes'
if classes.exists():shutil.rmtree(classes)
classes.mkdir(parents=True,exist_ok=True)
def run(args):subprocess.run([str(x) for x in args],check=True)
sources=sorted((root/'app/src/main/java').rglob('*.java'))
run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-encoding','UTF-8','-source','17','-target','17','-classpath',sdk,'-d',classes,*sources])
run([bt/'aapt2','compile','--dir','app/src/main/res','-o',out/'resources.zip'])
manifest=(root/'app/src/main/AndroidManifest.xml').read_text().replace('<manifest ','<manifest package="pro.busspark.game" ',1)
(out/'AndroidManifest.xml').write_text(manifest)
run([bt/'aapt2','link','-o',out/'unsigned.apk','--manifest',out/'AndroidManifest.xml','-I',sdk,'-A',root/'app/src/main/assets','--min-sdk-version','26','--target-sdk-version','35','--version-code','1','--version-name','0.1.0',out/'resources.zip'])
(out/'classes.list').write_text('\n'.join(str(p) for p in classes.rglob('*.class')))
run(['java','-cp',bt/'lib/d8.jar','com.android.tools.r8.D8','--lib',sdk,'--min-api','26','--output',out,'@'+str(out/'classes.list')])
with zipfile.ZipFile(out/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:z.write(out/'classes.dex','classes.dex')
run([bt/'zipalign','-p','-f','4',out/'unsigned.apk',out/'aligned.apk'])
dest=root/'dist';dest.mkdir(exist_ok=True);apk=dest/'BusSpark-0.1.0.apk'
run(['java','-jar',bt/'lib/apksigner.jar','sign','--debuggable-apk-permitted','false','--v4-signing-enabled','false','--ks',key,'--ks-key-alias',alias,'--ks-pass','env:BUS_KEY_PASSWORD','--out',apk,out/'aligned.apk'])
run(['java','-jar',bt/'lib/apksigner.jar','verify','--verbose',apk]);run([bt/'aapt2','dump','badging',apk]);run([bt/'zipalign','-c','4',apk])
print('APK:',apk)
