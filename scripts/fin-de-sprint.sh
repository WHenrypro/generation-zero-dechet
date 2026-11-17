#!/usr/bin/env bash
# Pose le tag de fin de sprint et affiche ce qui a été fait pendant le sprint.
# Usage : ./scripts/fin-de-sprint.sh 1 "8 points terminés sur 10"
set -euo pipefail

n="${1:?Donne le numéro du sprint (1 à 4)}"
message="${2:-Fin du sprint $n}"
tag="sprint-$n"

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain)" ]; then
  echo "Il reste des modifications non commitées. Commitez (ou git stash) avant de poser le tag."
  exit 1
fi

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
  echo "Le tag $tag existe déjà. Pour le déplacer : git tag -d $tag puis relancer."
  exit 1
fi

git tag -a "$tag" -m "$message"
echo "Tag $tag posé sur $(git rev-parse --short HEAD) : $message"

# Commits depuis le tag précédent (ou depuis le début s'il n'y en a pas).
if [ "$n" -gt 1 ] && git rev-parse -q --verify "refs/tags/sprint-$((n-1))" >/dev/null; then
  depuis="sprint-$((n-1))"
else
  depuis="$(git rev-list --max-parents=0 HEAD)"
fi
echo
echo "Commits du sprint $n :"
git log --oneline "$depuis..$tag"
echo
echo "N'oubliez pas : git push --tags, puis remplir sprints/$tag.md et le cadre Miro."
