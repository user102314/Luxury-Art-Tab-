# Connexion Supabase — tables créées automatiquement

Hibernate crée et met à jour les **11 tables** au démarrage de Spring Boot (`ddl-auto=update`).
Vous n'avez **pas besoin** d'exécuter `schema.sql` manuellement.

## 1. Récupérer les credentials Supabase

Dans Supabase : **Project Settings** → **Database** → **Connection string** → **URI**

## 2. Configurer

Éditez `src/main/resources/application-local.properties` avec votre URL et mot de passe.

## 3. Lancer

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=supabase,local
```
