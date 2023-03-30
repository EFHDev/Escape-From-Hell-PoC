@echo off

rem Run your command here
start cmd /c "npm install && pause"
echo Once NPM finishes installing the deps press any button...
pause
rem Write a new bat file that runs a command
echo @echo off > StartServer.bat
echo npm start  >> StartServer.bat
echo pause  >> StartServer.bat
call StartServer.bat
rem Delete the original bat file
del "%~f0"