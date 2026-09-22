# StaffPhoto

Android-приложение для карточек сотрудников: фамилия, имя, отчество и фото.

Данные хранятся локально на телефоне.

## Эмулятор Realme (по центру экрана)

Запуск с автоматическим центрированием окна:

```powershell
.\scripts\start-realme.cmd
```

или:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Start-RealmeEmulator.ps1
```

Скрипт при каждом запуске ставит окно эмулятора по центру экрана и сохраняет позицию для следующего старта.

## Готовый APK

Файл для установки:

**[dist/StaffPhoto.apk](dist/StaffPhoto.apk)**

### Установка на смартфон

1. Скопируйте `dist/StaffPhoto.apk` на телефон (USB, Telegram, Google Drive и т.п.).
2. Откройте файл на телефоне.
3. Разрешите установку из этого источника, если Android спросит.
4. Установите приложение **StaffPhoto**.

Через USB (если включена отладка):

```bash
adb install -r dist/StaffPhoto.apk
```

## Возможности

- Список сотрудников и поиск по ФИО
- Добавление / редактирование / удаление
- Фото из галереи или с камеры

## Исходники

Нативное Android-приложение (Kotlin): папка `native-android/`.

Сборка APK:

```powershell
cd native-android
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
.\gradlew.bat assembleDebug
copy app\build\outputs\apk\debug\app-debug.apk ..\dist\StaffPhoto.apk
```
