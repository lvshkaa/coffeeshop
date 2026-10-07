@echo off
chcp 65001 >nul
title DrinkStar
echo Запуск сайта DrinkStar...
echo Сайт откроется по адресу http://localhost:3000
echo Экран персонала: http://localhost:3000/staff.html  (PIN по умолчанию 1234)
echo Аналитика:       http://localhost:3000/admin.html   (PIN по умолчанию 0000)
echo Чтобы остановить, закройте это окно.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ОШИБКА: не установлен Node.js. Скачайте с https://nodejs.org (версия 22.13 или новее^) и запустите снова.
  pause
  exit /b 1
)
start "" http://localhost:3000
node server.js
pause
