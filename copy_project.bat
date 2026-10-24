@echo off
title TERA Project File Copier
echo ==========================================================
echo   TERA (Emergency Resource Platform) - Quick Copy Tool
echo ==========================================================
echo.
set "DEFAULT_DEST=%USERPROFILE%\Desktop\tera_project"
echo Where would you like to copy all the project files?
echo Press Enter to copy to Default: %DEFAULT_DEST%
set /p "DEST=Target folder: "
if "%DEST%"=="" set "DEST=%DEFAULT_DEST%"

echo.
echo Preparing target: %DEST% ...
mkdir "%DEST%" 2>nul

echo Copying all project files...
robocopy "%~dp0." "%DEST%" /E /XD node_modules venv .git .pytest_cache __pycache__ .vercel /XF *.zip .DS_Store

echo.
echo ==========================================================
echo SUCCESS: All project files have been copied to:
echo    %DEST%
echo ==========================================================
echo.
explorer "%DEST%"
pause
