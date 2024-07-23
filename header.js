const nheaders={
    "age":'0'
}
const removeheaders=[
    'content-length','date','expires'
]
function process(headerobj){
    var t=Object.keys(nheaders);
    var f={};
    Object.keys(headerobj).forEach(e=>{
        if(t.includes(e)){
            f[e]=nheaders[e]
        }else if(!removeheaders.includes(e)){
            f[e]=headerobj[e]
        }
    })
    return f;
}
module.exports=process;