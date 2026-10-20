const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../../../..');
const {loadDrawioPlantUmlEngine,convertPumlToXml}=require(path.join(root,'scripts/build_drawio_from_puml.js'));
const out=__dirname,src=path.join(root,'docs/modeling/current-target/src');
const ids=['ACT-08','SEQ-03','SEQ-04','SEQ-08','STA-03','DATA-03'];
const engine=loadDrawioPlantUmlEngine();
for(const id of ids){
 const name=fs.readdirSync(src).find(n=>n.startsWith(id+'-'));
 const result=convertPumlToXml(path.join(src,name),src,engine);
 fs.writeFileSync(path.join(out,id+'.raw.xml'),result.wrappedXml);
 console.log(id,result.wrappedXml.length);
}
