import assert from 'node:assert/strict';
import { lessons } from '../app/lessons.ts';
import { weakWords, localDay } from '../app/lab-utils.ts';
assert.equal(lessons.length,12);
assert.equal(new Set(lessons.map(x=>x.id)).size,12);
for(const category of ['daily','academic'])assert.equal(lessons.filter(l=>l.category===category).length,6);
for(const lesson of lessons){assert.equal(lesson.words.length,4);assert.equal(lesson.sentences.length,3);assert.equal(lesson.questions.length,3);assert.equal(lesson.hints.length,3);for(const w of lesson.words)assert.ok(w.word&&w.ipa&&w.meaning&&w.tip);}
const result=weakWords({source:'test',reference:'test',result:{Words:[{Word:'participant',AccuracyScore:45,ErrorType:'Mispronunciation'},{Word:'omitted',AccuracyScore:0,ErrorType:'Omission'},{Word:'extra',PronunciationAssessment:{AccuracyScore:20,ErrorType:'Insertion'}},{Word:'good',AccuracyScore:94,ErrorType:'None'},{Word:'measure',PronunciationAssessment:{AccuracyScore:62,ErrorType:'Mispronunciation'}},{Word:'unscored',ErrorType:'None'}]}});
assert.deepEqual(result,[{word:'participant',score:45},{word:'measure',score:62}]);
assert.equal(localDay(new Date(2026,10,7,9)), '2026-11-07');
console.log('Passed: 12 complete lessons, acoustic score selection, omission/insertion exclusion, local calendar date.');
