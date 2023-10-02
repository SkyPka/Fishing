var req,res;

class DataTransport{
    response="";
    header="";
    errMsg="";
    CURL_enable_jsonp=false;
    CURL_enable_native=true;
    CURL_valid_url_regex='/.*/';
    CURL_SendCookie="";
    CURL_SendSession="";
    CURL_mode="native";
    CURL_CallBack="";
    CURL_user_agent="";
    CURL_full_headers="1";
    CURL_full_status='1';

    go(url, postdata='',mode="native"){
        if(function_exists("curl_init")){
            return this.Post_CURL(url, postdata,mode);
        }
        else
        {
            return this.Post_FILE_GET_CONTENTS(url, postdata);
        }
    }

    Post_CURL(url, postdata=null,mode="native"){
        this.errMsg="";

        this.response="";
        this.header="";
        if ( !url ) {

            // Passed url not specified.
            contents = 'ERROR: url not specified';
            status = {http_code:'ERROR'};

        } else if (!this.CURL_valid_url_regex.test(url)) {

            // Passed url doesn't match valid_url_regex.
            contents = 'ERROR: invalid url';
            status = {http_code:'ERROR'};

        } else {
            ch = curl_init( url );

            // 设置post数据
            if ( postdata!=null ) {
                curl_setopt( ch, CURLOPT_POST, true );
                @curl_setopt( ch, CURLOPT_POSTFIELDS, postdata );////////////////////////Difficulties
            }
            // 设置cookie数据
            if (this.CURL_SendCookie ) {
                cookie = array();
                foreach ( _COOKIE as key => value ) {
                    cookie[] = key + '=' + value;
                }
                if ( this.CURL_SendSession ) {
                    cookie[] = SID;
                }
                cookie = implode( '; ', cookie );

                curl_setopt( ch, CURLOPT_COOKIE, cookie );
            }
            curl_setopt(ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt(ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt(ch, CURLOPT_BINARYTRANSFER,true);
            curl_setopt(ch, CURLOPT_HTTPHEADER, array("Expect:"));
            curl_setopt(ch, CURLOPT_HEADER, true);
            curl_setopt(ch, CURLOPT_HTTP_VERSION, '1.0'); // 使用 Http1.0 避免chunked
            curl_setopt(ch, CURLOPT_TIMEOUT, 60); // 设置超时

            curl_setopt( ch, CURLOPT_USERAGENT, this.CURL_user_agent ? this.CURL_user_agent : @_SERVER['HTTP_USER_AGENT'] );////////////////////////Difficulties

            getresponse = curl_exec(ch);
            list( header, contents ) = preg_split( '/([\r\n][\r\n])\\1/', getresponse, 2 );



            if (curl_getinfo(ch, CURLINFO_HTTP_CODE) == '200') {
                headerSize = curl_getinfo(ch, CURLINFO_HEADER_SIZE);
                this.header = substr(getresponse, 0, headerSize);
                this.response = substr(getresponse, headerSize);
            }

            status = curl_getinfo( ch );

            curl_close( ch );
        }

        // Split header text into an array.
        header_text = header.split(/[\r\n]+/);

        if ( mode == 'native') {
            if ( !this.CURL_enable_native) {
                contents = 'ERROR: invalid mode';
                status = {http_code:'ERROR'};
            }

            // Propagate headers to response.
            /* foreach ( header_text as header ) {
                 header( header );
             }
 */
            return contents;

        }
        else
        {

            // data will be serialized into JSON data.
            data = array();

            // Propagate all HTTP headers into the JSON data object.
            if (this.CURL_full_headers) {
                data['headers'] = array();

                header_text.forEach(header=>{
                    matches=header.match(/^(.+?):\s+(.*)$/);
                    if ( matches ) {
                        data['headers'][ matches[1] ] = matches[2];
                    }
                })
            }

            // Propagate all cURL request / response info to the JSON data object.
            if ( this.CURL_full_status) {
                data['status'] = status;
            } else {
                data['status'] = array();
                data['status']['http_code'] = status['http_code'];
            }

            // Set the JSON data object contents, decoding it from JSON if possible.
            decoded_json = json_decode( contents );
            data['contents'] = decoded_json ? decoded_json : contents;

            // Generate appropriate content-type header.
            is_xhr = strtolower(_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
            header( 'Content-type: application/' + ( is_xhr ? 'json' : 'x-javascript' ) );

            // Get JSONP callback.
            jsonp_callback = this.CURL_enable_jsonp && isset(this.CURL_CallBack) ? this.CURL_CallBack : null;

            // Generate JSON/JSONP string
            json = json_encode( data );

            return jsonp_callback ? "jsonp_callback(json)" : json;

        }
    }

    Post_FILE_GET_CONTENTS(url, post = null)
    {
        context ={};
        if (is_array(post)) {
            ksort(post);
            context['http'] ={
                'timeout':10,
                'method' : 'POST',
                'header' : 'Content-type: application/x-www-form-urlencoded',
                'content': http_build_query(post, '', '&'),
            };
        }
        this.response=file_get_contents(url, false, stream_context_create(context));
        return this.response;
    }

}

module.export=DataTransport;