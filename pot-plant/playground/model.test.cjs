const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const M=require('./model.js');
const context=vm.createContext({Math,performance});
vm.runInContext(fs.readFileSync(__dirname+'/geometry.js','utf8')+'\nglobalThis.sample=(i,after)=>spiralPts(Array(8).fill(1),after?0:-1,i);globalThis.lengthOf=spiralLength;globalThis.sectorOf=sector;',context);
const beforePoints=Array.from({length:8},(_,i)=>context.sample(i,false));
const afterPoints=Array.from({length:8},(_,i)=>context.sample(i,true));
for(let a=0;a<8;a++)for(let b=0;b<8;b++){
 assert(context.lengthOf(afterPoints[b])>context.lengthOf(beforePoints[a]));
 const [x,y]=afterPoints[b].at(-1);assert(Math.hypot(x-440,y-440)>108);
}
let count=0;
function permutations(prefix,rest){if(!rest.length){
 const before=[...prefix],after=M.develop(before);M.validate(after);
 assert.deepEqual(after,M.develop(before));assert.notEqual(after[0],before[0]);
 assert.equal(after.indexOf(before[0]),3);
 assert.equal(M.radius(after,after[0],true)-M.radius(before,before[0]),36);
 assert.equal(new Set(after.map(k=>M.radius(after,k,true))).size,8);
 before.slice(1).forEach(k=>assert(M.radius(after,k,true)-M.radius(before,k)>=-36));
 const without=after.filter(k=>k!==before[0]),original=before.slice(1);
 let inversions=0;for(let i=0;i<7;i++)for(let j=i+1;j<7;j++)if(original.indexOf(without[i])>original.indexOf(without[j]))inversions++;
 assert.equal(inversions,1);assert.deepEqual(prefix,before);count++;return;
}rest.forEach((k,i)=>permutations([...prefix,k],rest.filter((_,j)=>j!==i)))}
permutations([],M.IDS);
assert.equal(count,40320);
assert.throws(()=>M.develop(Array(8).fill('LR')));
console.log('PASS: all 40,320 permutations; movement, determinism, uniqueness, relative order; all 64 compass stopping-point combinations extend the spiral.');
