import {test} from 'node:test';
import assert from 'node:assert/strict';
const {profilePatchSchema}=await import('../../src/server/profile/dto.ts');
test('profile names are trimmed and reject empty, long, control and unrelated fields',()=>{
 assert.equal(profilePatchSchema.parse({displayName:'  Mai  ',expectedRowVersion:'1'}).displayName,'Mai');
 for(const displayName of ['', 'a'.repeat(41),'Mai\nLan'])assert.equal(profilePatchSchema.safeParse({displayName,expectedRowVersion:'1'}).success,false);
 assert.equal(profilePatchSchema.safeParse({displayName:'Mai',expectedRowVersion:'1',role:'ADMIN'}).success,false);
});

const {requiredProgress}=await import('../../src/server/context/progress.ts');
test('required progress uses current level and distinct completed lesson identities',()=>{
 assert.deepEqual(requiredProgress({workingLevel:{id:'N5'},course:{units:[{levelId:'N5',lessons:[{id:'one'},{id:'two'}]},{levelId:'N4',lessons:[{id:'three'}]}]},lessonCompletions:[{lessonId:'one'},{lessonId:'three'}]}),{requiredDone:1,requiredTotal:2});
 assert.deepEqual(requiredProgress({workingLevel:null,course:{units:[]}}),{requiredDone:0,requiredTotal:0});
});
