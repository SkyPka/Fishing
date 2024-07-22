(function(){
    const table="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const pack=data=>data.map(e=>table[e]).join("")
    const depack=data=>data.split("").map(e=>table.indexOf(e))

    function encrypt(Data,Charssss=7,Ks=1){

        var data=depack(btoa(encodeURIComponent(Data)).replaceAll("=",""))
        for(var i=0;i<data.length;i+=Charssss){
            data[i]=63^data[i]
        }
        for(var i=0;i<data.length;i++){
            data[i]=(data[i]+Ks)%64
        }
        return pack(data);
    }
    function decrypt(Data,Charssss=7,Ks=1){
        var data=depack(Data);
        for(var i=0;i<data.length;i++){
            data[i]=(data[i]+64-Ks%64)%64
        }
        for(var i=0;i<data.length;i+=Charssss){
            data[i]=63^data[i]
        }
        return decodeURIComponent(atob(pack(data)));
    }
    return {decrypt:decrypt,encrypt:encrypt};
})()