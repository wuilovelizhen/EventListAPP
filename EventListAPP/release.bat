@echo on

cd bin\Android\Release

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-release-unsigned.apk alias_name

E:\Android\sdk\android-sdk\build-tools\22.0.1\zipalign.exe -v 4 android-release-unsigned.apk TMS.apk

xcopy /y "%~dp0bin\Android\Release\TMS.apk" "%~dp0"

del "%~dp0bin\Android\Release\TMS.apk" /f /q

pause