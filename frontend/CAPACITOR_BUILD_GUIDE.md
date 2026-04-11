# Guía para Generar Apps Nativas con Capacitor

## Requisitos Previos

### Para Android:
1. **Android Studio** (descargar de: https://developer.android.com/studio)
2. **Java JDK 17+** instalado
3. **Android SDK** (se instala con Android Studio)

### Para iOS (solo en Mac):
1. **Xcode 15+** (desde App Store)
2. **CocoaPods**: `sudo gem install cocoapods`
3. Cuenta de desarrollador Apple (para publicar en App Store)

---

## Paso 1: Build del Proyecto Web

```bash
cd /app/frontend
yarn build
```

## Paso 2: Inicializar Capacitor (solo primera vez)

```bash
# Añadir plataforma Android
npx cap add android

# Añadir plataforma iOS (solo Mac)
npx cap add ios
```

## Paso 3: Sincronizar Cambios

Cada vez que hagas cambios en el código web:

```bash
yarn build
npx cap sync
```

## Paso 4: Abrir en IDE Nativo

### Android Studio:
```bash
npx cap open android
```

### Xcode (Mac):
```bash
npx cap open ios
```

---

## Generar APK de Android

1. Abre Android Studio con `npx cap open android`
2. Espera que Gradle sincronice el proyecto
3. Ve a `Build > Build Bundle(s) / APK(s) > Build APK(s)`
4. El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Para APK firmado (Play Store):
1. Ve a `Build > Generate Signed Bundle / APK`
2. Selecciona "APK"
3. Crea o usa un keystore existente
4. Selecciona "release"
5. El APK firmado estará en: `android/app/release/app-release.apk`

---

## Generar IPA de iOS (solo Mac)

1. Abre Xcode con `npx cap open ios`
2. Selecciona tu equipo de desarrollo en Signing & Capabilities
3. Selecciona dispositivo "Any iOS Device (arm64)"
4. Ve a `Product > Archive`
5. En Organizer, haz clic en "Distribute App"

---

## Configuración de Permisos (ya incluidos)

### Android (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
```

### iOS (`ios/App/App/Info.plist`):
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Se necesita acceso al micrófono para transmitir como DJ</string>
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

---

## Estructura de Archivos Generados

```
/app/frontend/
├── android/                  # Proyecto Android Studio
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/          # Iconos y splash
│   │   └── build.gradle
│   └── build.gradle
├── ios/                      # Proyecto Xcode
│   ├── App/
│   │   ├── App/
│   │   │   └── Info.plist
│   │   └── App.xcworkspace
│   └── Podfile
└── capacitor.config.json     # Configuración principal
```

---

## Iconos de la App

Los iconos ya están configurados en `/frontend/public/icons/`:
- `icon-192x192.png` → Android adaptive icon
- `icon-512x512.png` → Play Store listing
- `icon-maskable-*` → Android 8+ adaptive icons

Para iOS, copia los iconos a los Asset Catalogs en Xcode.

---

## Notas Importantes

1. **Audio en segundo plano**: Ya configurado en `capacitor.config.json` con `BackgroundTask`
2. **HTTPS obligatorio**: La app usa HTTPS para streaming y WebSockets
3. **Tamaño del APK**: ~15-25 MB estimado
4. **Versión mínima Android**: API 22 (Android 5.1)
5. **Versión mínima iOS**: iOS 13.0

---

## Solución de Problemas

### "Gradle sync failed"
- Asegúrate de tener Java 17+ instalado
- En Android Studio: File > Invalidate Caches / Restart

### "Pod install failed"
```bash
cd ios/App
pod install --repo-update
```

### El audio no funciona en iOS
- Verifica que `UIBackgroundModes` incluye "audio" en Info.plist
- Prueba en dispositivo real, no simulador

---

## Contacto

Para soporte con la generación de builds, contacta a soporte@salsamixlive.com
