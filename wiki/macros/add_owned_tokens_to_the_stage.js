const ownedActors = game.actors.filter(a => a.permission === 3);
const ownedTokens = ownedActors.map(a => a.getActiveTokens());

for (const tokenArray of ownedTokens) {
    tokenArray.forEach(t => Theatre.addToNavBar(t.actor));
}