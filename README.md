# Mutuelle Mobile — Frontend

App mobile Expo / React Native du projet Mutuelle Mobile.

## Lancer en local

```bash
npm install
npx expo start
```

Puis ouvrir l'app sur un [development build](https://docs.expo.dev/develop/development-builds/introduction/),
un émulateur Android/iOS, ou [Expo Go](https://expo.dev/go).

Renseigner `EXPO_PUBLIC_API_URL` dans `.env.local` selon la cible :

- Device physique (même Wi-Fi que le backend) : `http://<IP-machine-hôte>:8080`
- Émulateur Android : `http://10.0.2.2:8080`
- Simulateur iOS : `http://localhost:8080`
- Backend lancé via le `docker compose up --build` à la racine du repo : `http://localhost:8080`

## Lancer en mode web (Docker)

Voir le `docker-compose.yml` à la racine du repo — `docker compose up --build` lance le front
en mode web (`expo start --web`) avec le backend et la base de données.

## Ressources Expo

- [Documentation Expo](https://docs.expo.dev/)
- [Routing par fichiers](https://docs.expo.dev/router/introduction)
