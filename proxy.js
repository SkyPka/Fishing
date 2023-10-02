const DataTransport=require("./DataTransport");
const Tamper=require("./Tamper");
var req,res;
//ob_start();
sURL=_REQUEST['url'];


if(!empty(sURL))
{
    dataTransport=new DataTransport();
    //处理出现https:///或者http:///的问题，不是根本解决办法，有点偷懒
    sURL=Tamper.fix_request_url(sURL);
    postArray=array();

//文件处理
    if(Boolean(_FILES)){
        Object.keys(_FILES).forEach(key=>{
            var value=_FILES[key];
            move_uploaded_file(value['tmp_name'], value['name']);
            postArray[key]='@'.realpath(value['name']);
        })
    }

//处理POST数据
    Object.keys(_POST).forEach(key=>{
        postArray[key]=_POST[key];
    })

//处理GET
    Object.keys(_REQUEST).forEach(key=>{
        if(key!=='url'){
            sURL+='&'+key+'='+_REQUEST[key];
        }
    })

//获取数据
    dataTransport.go(sURL,postArray);

//处理数据

dataTransport.header.split(/[\r\n]+/).forEach (headertext=>{

        //处理因为Content-Security-Policy而导致的资源不能加载的情况
        pos = strpos(headertext, 'Content-Security-Policy');
        if (pos === false) {
            header(headertext);
        }

    })
//Hook所有url
    dataTransport.response = Tamper.hook(sURL, dataTransport.response);
    print(dataTransport.response);

//删除临时文件
    if(Boolean(_FILES)){
        Object.keys(_FILES).forEach(key=>{
            unlink(_FILES[key]['name']);
        })
    }

} else{
    res.send('url null');
}

//ob_end_flush();

