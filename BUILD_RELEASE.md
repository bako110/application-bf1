# Guide de Build Release APK - BF1 App

## 📋 Prérequis

1. **Keystore configuré** dans `android/gradle.properties`
2. **Node modules installés** : `npm install`
3. **Android SDK** installé

## 🚀 Étapes pour builder l'APK Release

### 1. Nettoyer le projet
```bash
cd android
./gradlew clean
cd ..
```

### 2. Builder l'APK Release
```bash
cd android
./gradlew assembleRelease
```

### 3. Localisation de l'APK
L'APK sera généré dans :
```
android/app/build/outputs/apk/release/
```

Fichiers générés :
- `app-arm64-v8a-release.apk` (ARM 64-bit - recommandé)
- `app-armeabi-v7a-release.apk` (ARM 32-bit)
- `app-x86-release.apk` (Intel 32-bit)
- `app-x86_64-release.apk` (Intel 64-bit)
- `app-universal-release.apk` (Tous les architectures - plus lourd)

## 📦 Optimisations appliquées

### ✅ ProGuard activé
- Minification du code Java
- Obfuscation des classes
- Suppression du code mort
- Suppression des logs de debug

### ✅ Shrink Resources
- Suppression des ressources inutilisées
- Réduction de la taille de l'APK

### ✅ APK Splits
- APK séparés par architecture
- Taille réduite pour chaque appareil

### ✅ Hermes Engine
- Compilation JavaScript optimisée
- Démarrage plus rapide
- Moins de mémoire utilisée

## 📱 Installation sur appareil

### Via USB (ADB)
```bash
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

### Via fichier
1. Copier l'APK sur le téléphone
2. Activer "Sources inconnues" dans les paramètres
3. Ouvrir le fichier APK et installer

## 🎨 Splash Screen

L'icône de démarrage affichera :
- Fond noir (#000000)
- Logo BF1 centré
- Transition fluide vers l'app

## 📊 Taille estimée de l'APK

- **ARM 64-bit** : ~25-35 MB (recommandé)
- **ARM 32-bit** : ~20-30 MB
- **Universal** : ~60-80 MB (contient toutes les architectures)

## 🔧 Commandes utiles

### Vérifier la signature
```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

### Analyser la taille de l'APK
```bash
./gradlew :app:analyzeReleaseBundle
```

### Builder AAB (pour Play Store)
```bash
cd android
./gradlew bundleRelease
```

## ⚠️ Notes importantes

1. **Testez toujours** l'APK release avant distribution
2. **Utilisez ARM 64-bit** pour la plupart des appareils modernes
3. **Gardez votre keystore** en sécurité (ne jamais commit)
4. **Incrémentez versionCode** à chaque release

## 🐛 Résolution de problèmes

### Erreur de signature
- Vérifier `gradle.properties`
- Vérifier le chemin du keystore

### APK trop lourd
- Utiliser les splits (déjà activé)
- Vérifier les assets inutilisés
- Activer ProGuard (déjà activé)

### Crash au démarrage
- Vérifier les règles ProGuard
- Tester en mode debug d'abord
