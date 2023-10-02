var req,res;
const DataTransport=require("./DataTransport");
var Tamper={
    enable_image_to_base64:false,
    //开启图像变为base64
    get_image_to_base64DataUrl:function(url){
        imageData=new DataTransport();
        imageData.go(url);
        contentTypeMatch=imageData.header.match(/Content-Type:(.*?)[\r\n]+/is);

        return 'data:'+contentTypeMatch[1][0]+';base64, '+btoa(imageData.response);
    },

    hook:function(url,response) {
        var protocol = req.protocol+"//";//'https://' : 'http://';
        var hook_target;
        //解决因为请求资源而导致的异常
        if(url.endsWith(".css")||url.endsWith(".js")){
            // 获取当前url的根地址
            var hook_url_temp = req.headers.referer;//_SERVER['HTTP_REFERER'];
            while(hook_url_temp[hook_url_temp.length - 1] != '/' && hook_url_temp != '') {
                hook_url_temp = hook_url_temp.slice(0,-1);
            }

            if(hook_url_temp.endWith("://")){
                hook_target=req.headers.referer+'/';
            }else{
                hook_target = hook_url_temp;
            }

        }else{
            hook_target =req.path//_SERVER['PHP_SELF'] + '?url=';
            // 获取当前url的根地址
            hook_url_temp = url;
            while(hook_url_temp[hook_url_temp.length - 1] != '/' && hook_url_temp != '') {
                hook_url_temp = hook_url_temp.slice(0,-1);
            }
            hook_target = hook_target + hook_url_temp;

            //解决因为例如https://github.com后面没有加/而导致的hook路径错误问题
            var urlmatches=url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/i);//"~^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?~i");

            /*@*/
            var checkrooturl=hook_url_temp.urlmatches[4];
            if(checkrooturl==url){
                hook_target = hook_target +urlmatches[4]+'/';
            }

        }


        //URLENCODE！！！
        var pageUrlArray;
        urlMatchs=response.match(/=("|\')[\/]{1,2}(.*?)("|\')/is);
        pageUrlArray=pageUrlArray.concat(pageUrlArray,urlMatchs[2]);
        urlMatchs=response.match(/href=("|\')(.*?)("|\')/is);
        pageUrlArray=pageUrlArray.concat(pageUrlArray,urlMatchs[2]);
        urlMatchs=response.match(/=("|\')http(.*?)("|\')/is);
        pageUrlArray=pageUrlArray.concat(pageUrlArray,urlMatchs[2]);
        urlMatchs=response.match(/url(\("|\(\'|\()(.*?)("\)|\'\)|\))/is);
        pageUrlArray=pageUrlArray.concat(pageUrlArray,urlMatchs[2]);

        if(pageUrlArray.length){
            //解决某些相同的短字符串匹配后，影响后面比它更长的字符串的匹配
            pageUrlArrayElementsLengthArray=[];
            pageUrlArray.forEach(nowPageUrl=>{
                pageUrlArrayElementsLengthArray.push(nowPageUrl.length);
            })
            array_multisort(pageUrlArrayElementsLengthArray,SORT_DESC,SORT_NUMERIC,pageUrlArray);////////////////////////Difficulties

            pageUrlArray.forEach(pageUrl=>{
                    //解决错误替换了VIEWSTATE的问题,用于验证是否是比较合法的url
                    if(pageUrl.indexOf('.')>0){
                        response = response.replaceAll(pageUrl, encodeURI(pageUrl));
                    }
                }
            )
        }


        if(Tamper.enable_image_to_base64) {
            response = response.replaceAll(/background-image:url/is, '！！！replacebgimgurl！！！');
            response = response.replaceAll(/background:url/is, '！！！replacebgurl！！！');
        }



        //因为需要篡改页面，所以需要去除integrity的限定
        response = response.replaceAll(/integrity=(\'|\")\S*(\'|\")/i, '');

        //计划先换成其他字符，避免被后面的正则再次替换。
        response = response.replaceAll(/=\'http/i, '！！！replacehttp1！！！');
        response = response.replaceAll(/=\"http/i, '！！！replacehttp2！！！');
        response = response.replaceAll(/=\'\/\//is, '！！！replace1！！！');
        response = response.replaceAll(/=\"\/\//is, '！！！replace2！！！');
        response = response.replaceAll(/=\'.\//is, '！！！replacedot1！！！');
        response = response.replaceAll(/=\".\//is, '！！！replacedot2！！！');
        response = response.replaceAll(/href=\'/is, '！！！replacehref1！！！');
        response = response.replaceAll(/href="/is, '！！！replacehref2！！！');



        // 替换基本的 / 根引用 成本网址的根引用

        response = response.replaceAll(/=\'\//is, '=\'' + hook_target);
        response = response.replaceAll(/=\"\//is, '="' + hook_target);
        response = response.replaceAll(/url\('\//is, 'url(\'' + hook_target);
        response = response.replaceAll(/url\(\"\//is, 'url("' + hook_target);

        // 替换 http绝对引用 为 本网址的相对引用
        http_abs_ref = req.path + '?url=http';

        response = response.replaceAll(/！！！replacehttp1！！！/is, '=\'' +http_abs_ref);
        response = response.replaceAll(/！！！replacehttp2！！！/is, '="' +http_abs_ref);


        response = response.replaceAll(/！！！replace1！！！/is, '=\'' + req.path + '?url='+protocol);
        response = response.replaceAll(/！！！replace2！！！/is, '="' + req.path + '?url='+protocol);
        response = response.replaceAll(/！！！replacedot1！！！/is, '=\'' + hook_target);
        response = response.replaceAll(/！！！replacedot2！！！/is, '="' + hook_target);
        response = response.replaceAll(/！！！replacehref1！！！/is, 'href=\'' + hook_target);
        response = response.replaceAll(/！！！replacehref2！！！/is, 'href="' + hook_target);


        if(Tamper.enable_image_to_base64)
        {
            response = response.replaceAll(/！！！replacebgurl！！！/is, 'background:url' );
            response = response.replaceAll(/！！！replacebgimgurl！！！/is, 'background-image:url' );
            var refererUrl;
            var toolreferurl=new URL(hook_target).search.slice(1).split("&");
            for(var i=0;i<toolreferurl.length;i++){
                if(toolreferurl[i].split("=")[0]=="url"){
                    refererUrl=toolreferurl[i].split("=")[1];
                    break;
                }
            };
            var bgMatchs=response.match(/background:url(\("|\(\'|\()(.*?)("\)|\'\)|\))/is);
            var bgimageMatchs=response.match(/background-image:url(\("|\(\'|\()(.*?)("\)|\'\)|\))/is);
            images=[bgMatchs[2],bgimageMatchs[2]];
            // start with /
            parse_url_refererUrl=parse_url(refererUrl);
            refererRootUrl=parse_url_refererUrl['scheme']+'://'+parse_url_refererUrl['host']+(array_key_exists('port',parse_url_refererUrl)?(':'+parse_url_refererUrl['port']):'');
            images.forEach(imageurl=>{
                readImgUrl='';
                //处理以/开始的url
                if(imageurl.startsWith('/')){
                    readImgUrl=refererRootUrl.imageurl;
                }
                else{
                    readImgUrl=refererUrl.imageurl;
                }
                imgDataBase64=Tamper.get_image_to_base64DataUrl(readImgUrl);

                //替换字符串需要处理不标准的写法，如没有使用‘或者“
                if(response.indexOf('background-image:url('+imageurl+')')>0){
                    response = response.replaceAll(imageurl, '"'+imgDataBase64+'"');
                }
                else{
                    response = response.replaceAll(imageurl, imgDataBase64);
                }
            })
        }

        return response;
    },

    /**
     * update : 2018-04-14 12:36:34
     * 改了一下 fix_request_url 的逻辑, 测试参考 test/url_format.php
     * 使用必须要求 url 是由 http/https 开头
     * 
     * @url 输入参数
     * @return 如果格式化成功返回 http[s]://prefix.domainname.org/req/page.html
     */
    fix_request_url(url){
        // url=preg_replace('/http:\/\/\//i','http://',url);
        // url=preg_replace('/https:\/\/\//i','https://',url);
        // return url;
        if (url.length){return ''};
        url_detail = [];
        url = urldecode(url);
        var url_detail=url.match(/^(https|http):\/{0,}(.*)$/)
        if (!url_detail||count(url_detail) != 3) return '';
        url = url_detail[1] + '://' + url_detail[2].replaceAll('/\/{2,}/', '/');
        return url;
    }

}


module.exports=Tamper;