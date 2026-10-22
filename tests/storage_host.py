"""JVM filesystem tests of the native storage core, not physical Android tests."""
from pathlib import Path
import subprocess,tempfile,os
ROOT=Path(__file__).resolve().parents[1]
jdk=Path(os.environ['JAVA_HOME'])/'bin' if 'JAVA_HOME' in os.environ else None
with tempfile.TemporaryDirectory() as out:
    src=ROOT/'android/gradle/app/src/main/java/io/godseed/one'
    subprocess.run([str(jdk/'javac') if jdk else 'javac','-d',out,str(src/'StoragePolicy.java'),str(src/'PackStore.java'),str(ROOT/'tests/java/StorageChecks.java')],check=True)
    subprocess.run([str(jdk/'java') if jdk else 'java','-cp',out,'io.godseed.one.StorageChecks'],check=True)
