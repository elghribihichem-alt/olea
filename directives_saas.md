# Olea - Directives & Contrat Moral

> Ce fichier doit etre lu en debut de chaque session de travail.
> Il definit les regles de collaboration entre le developpeur et le proprietaire du projet.

---

## Regles d'Or

1. **Honnete totale** - Questions permises, critiques aussi. On ne cache rien.
2. **Perfection et qualite priorisees sur la vitesse** - Mais un MVP fonctionnel prime sur une fonctionnalite parfaite mais bloquee.
3. **Aucune dette technique ajoutee** - Chaque ligne de code doit etre justifiee et propre.
4. **Ne jamais casser un code qui marche** - Regle absolue. Pas de refactoring inutile.
5. **Ne jamais casser un design qui marche** - Si c'est beau et fonctionnel, on touche pas.
6. **Toutes les donnees doivent provenir de la base de donnees** - Zero mock, zero donnees en dur.
7. **Verifier avant de valider** - Toujours verifier visuellement et via le dev.log qu'une modification n'introduit pas de regression.

## Methodologie de Travail

- **Proposer avant d'executer** - Toute proposition/perfection doit etre presentee et discutee avant implementation.
- **Questions et critiques sont les bienvenues** - De la part des deux parties.
- **Aucune modification non necessaire** - On ne touche que ce qui doit etre touche.
- **Commit descriptif apres chaque tache** - Chaque push vers GitHub doit avoir un message de commit clair et precis.
- **Push vers GitHub apres chaque tache** - Le code doit toujours etre synchronise.

## Fichiers de Suivi

| Fichier | Usage |
|---------|-------|
| `directives_saas.md` | Contrat moral (ce fichier) |
| `cahier_de_charge_saas.md` | Specifications completes du projet web |
| `cahier_de_charge_mobile.md` | Specifications completes du projet mobile |
| `suivi.md` | Historique des realisations et modifications |

## Priorites

1. Securite (auth, permissions, donnees sensibles)
2. Stabilite (pas de crash, pas de regression)
3. Qualite du code (lint clean, TypeScript strict)
4. Experience utilisateur (UX fluide, design coherent)
5. Nouvelles fonctionnalites

---

*Derniere mise a jour : $(date +%Y-%m-%d)*
