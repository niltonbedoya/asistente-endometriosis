@echo off
REM agent.cmd — control script for the Endometriosis Assistant project
REM Usage: agent.cmd [--doctor | --sync | --test | --dev | --all]

setlocal enabledelayedexpansion

if "%~1"=="" goto :help
if "%~1"=="--all" goto :all

if "%~1"=="--doctor" goto :doctor
if "%~1"=="--sync" goto :sync
if "%~1"=="--test" goto :test
if "%~1"=="--dev" goto :dev
goto :help

:all
call :doctor || goto :fail
call :sync || goto :fail
call :test || goto :fail
goto :eof

:doctor
echo [agent] gentle-ai doctor ...
call gentle-ai doctor
goto :eof

:sync
echo [agent] engram sync (project memory -^> .engram/) ...
call engram sync
if errorlevel 1 (
  echo [agent] WARN: engram sync failed; continuing without memory sync
)
goto :eof

:test
echo [agent] npm test (TDD suite) ...
call npm test
goto :eof

:dev
echo [agent] starting dev environment + local proxy ...
call npm run dev
goto :eof

:fail
echo [agent] FAILED: a step returned a non-zero exit code.
exit /b 1

:help
echo agent.cmd — control script
echo   agent.cmd --doctor   health check (gentle-ai doctor)
echo   agent.cmd --sync     project memory sync (engram sync)
echo   agent.cmd --test     run TDD suite (npm test)
echo   agent.cmd --dev      start dev environment
echo   agent.cmd --all      doctor + sync + test
goto :eof
