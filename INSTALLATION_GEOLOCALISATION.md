# Installation de la Géolocalisation

## Package requis

Pour que la géolocalisation fonctionne, vous devez installer le package suivant :

```bash
npm install @react-native-community/geolocation
```

## Configuration Android

### 1. Permissions dans AndroidManifest.xml

Ajoutez ces permissions dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### 2. Rebuild l'application

Après installation, rebuild l'application :

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Configuration iOS (si nécessaire)

### 1. Installer les pods

```bash
cd ios
pod install
cd ..
```

### 2. Permissions dans Info.plist

Ajoutez dans `ios/Bf1App/Info.plist` :

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>BF1 a besoin d'accéder à votre position pour adapter les tarifs d'abonnement.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>BF1 a besoin d'accéder à votre position pour adapter les tarifs d'abonnement.</string>
```

## Test

Après installation, l'application demandera automatiquement la permission de localisation lors de la première connexion.

## Fonctionnement

- **Au Burkina Faso** : Prix normaux (x1)
- **À l'étranger** : Prix x3

La localisation est vérifiée une fois toutes les 24 heures.
