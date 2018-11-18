/**
 * Created by jingzhe on 2018/10/17.
 */
 var db = require("./db.js");
const express = require('express');  // const是ES6的语法，代表常量，准确来说就是指向不发生改变。如果不习惯就用var代替
const app = express();               // express官网就是这么写的就是用来创建一个express程序，赋值给app。如果不理解就当公式记住
const server = require('http').Server(app);
const path = require('path');        // 这是node的路径处理模块，可以格式化路径
const io = require('socket.io')(server);     //将socket的监听加到app设置的模块里。

const users = [];                    //用来保存所有的用户信息
let usersNum = 0;
const _sockets = [];                 //将socket和用户名匹配
var qun = [];
server.listen(3000,'0.0.0.0',()=>{                // ()=>是箭头函数，ES6语法，如果不习惯可以使用 function() 来代替 ()=>
    console.log("server running at 127.0.0.1:3000");       // 代表监听3000端口，然后执行回调函数在控制台输出。
});

var loginuser = [];
/**
 * app.get(): express中的一个中间件，用于匹配get请求，所谓中间件就是在该轮http请求中依次执行的一系列函数。
 * '/': 它匹配get请求的根路由 '/'也就是 127.0.0.1:3000/就匹配到他了
 * (req,res): ES6语法的箭头函数，你暂时可以理解为function(req,res){}。
 * req带表浏览器的请求对象，res代表服务器的返回对象
 */
app.get('/',(req,res)=>{
    res.redirect('/chat.html');       // express的重定向函数。如果浏览器请求了根路由'/',浏览器就给他重定向到 '127.0.0.1:3000/chat.html'路由中
});



app.get('/qunjilu',(req,res)=>{
    var qunname = req.query.qunname;
    // var message = req.body.text;
    var sql = 'select * from qun where qname="'+qunname+'" ORDER BY qtime';
        db.query(sql,function (err,result) {
            if(err){
                console.log(err);
                return;
            }else{
                if(result[0]!=undefined){
                    res.json({message:result});
                }else{
                    res.json({message:result});
                }
            }
        })
});

app.get('/jilu',(req,res)=>{
    var user = req.query.username;
    var to = req.query.to;
    // var message = req.body.text;
    var sql = 'select * from jilu where user="'+user+'" and touser="'+to+'" or user="'+to+'" and touser="'+user+'" ORDER BY time';
        db.query(sql,function (err,result) {
            if(err){
                console.log(err);
                return;
            }else{
                if(result[0]!=undefined){
                    res.json({message:result});
                }else{
                    res.json({message:result});
                }
            }
        })
});
/**
 * __dirname表示当前文件所在的绝对路径，所以我们使用path.join将app.js的绝对路径和public加起来就得到了public的绝对路径。
 * 用path.join是为了避免出现 ././public 这种奇怪的路径
 * express.static就帮我们托管了public文件夹中的静态资源。
 * 只要有 127.0.0.1：3000/XXX 的路径都会去public文件夹下找XXX文件然后发送给浏览器。
 */
app.use('/',express.static(path.join(__dirname,'./public')));        //一句话就搞定。
// login
    app.get('/login',function (req,res) {
        var uname = req.query.uname;
        var upwd = req.query.upwd;
        var sql = 'select * from user where uname="'+uname+'" and upwd="'+upwd+'"';
        db.query(sql,function (err,result) {
            if(err){
                console.log(err);
                return;
            }else{
                if(result[0]!=undefined){
                    res.json({"result":{message:"success"}});
                }else{
                    res.json({"result":{message:"NO"}});
                }
            }
        })
        // var n = 0;
        // for(var i in loginuser){
        //     if(loginuser[i].uname==uname&loginuser[i].upwd==upwd){
        //         n++;
        //     }
        // }
        // if(n>0){
        //     res.json({"result":{message:"success"}});
        // }else{
        //     res.json({"result":{message:"NO"}});
        // }

    })
    app.get('/register',function (req,res) {
        var uname = req.query.uname;
        var upwd = req.query.upwd;
        var sex = req.query.sex;
        var tel = req.query.tel;
        console.log(sex);
        var sql = 'select * from user where uname="'+uname+'" and upwd="'+upwd+'"';
        
        db.query(sql,function (err,result) {
            if(err){
                console.log(err);
            }else{
                if(result[0]!=undefined){
                    res.json({"result":{message:"NO"}});
                }else{
                    var msg = "";
                    var sql1 = 'INSERT INTO user (uname,upwd,sex,tel) VALUES ("'+uname+'","'+upwd+'","'+sex+'","'+tel+'")';
                    db.query(sql1,function (err,result) {
                        if(err){
                            console.log(err);
                        }else{
                            res.json({"result":{message:"success"}});
                        }
                    })
                }
                // 
            }
        })
        // var user = {
        //     uname:uname,
        //     upwd:upwd
        // }
        // loginuser.push(user);
        // res.json({"result":{message:"success"}});
    })
/*socket*/
io.on('connection',(socket)=>{              //监听客户端的连接事件
    /**
     * 所有有关socket事件的逻辑都在这里写
     */
    usersNum ++;
    console.log(`当前有${usersNum}个用户连接上服务器了`);
    socket.on('login',(data)=>{
        console.log("已经登陆"+data.username);
        /**
         * 先保存在socket中
         * 循环数组判断用户名是否重复,如果重复，则触发usernameErr事件
         * 将用户名删除，之后的事件要判断用户名是否存在
         */
        socket.username = data.username;
        for (let user of users) {
            if(user.username === data.username){
                socket.emit('usernameErr',{err: '用户名重复'});
                socket.username = null;
                break;
            }
        }
        //如果用户名存在。将该用户的信息存进数组中
        if(socket.username){
            users.push({
                username: data.username,
                message: [],
                dataUrl: [],
                touXiangUrl: data.touXiangUrl
            });

            //保存socket
            _sockets[socket.username] = socket;
            //然后触发loginSuccess事件告诉浏览器登陆成功了,广播形式触发
            data.userGroup = users;         //将所有用户数组传过去
            io.emit('loginSuccess',data);   //将data原封不动的再发给该浏览器
        }


    });

    /**
     * 监听sendMessage,我们得到客户端传过来的data里的message，并存起来。
     * 我使用了ES6的for-of循环，和ES5 的for-in类似。
     * for-in是得到每一个key，for-of 是得到每一个value
     */
    socket.on('sendMessage',(data)=>{
        console.log(data.username);
        console.log(data.message);
        for(let _user of users) {
            if(_user.username === data.username) {
                _user.message.push(data.message);
                //信息存储之后触发receiveMessage将信息发给所有浏览器
                io.emit('receiveMessage',data);
                break;
            }
        }
    });


    socket.on('cjqun',(data)=>{
        socket.emit(data);
        var qname = {
            qname:data,
            users:[{user:socket.username}]
        }
        qun.push(qname);
        var arr = [];
        // for(var i in qun){
        //     for(var ii in qun[i].users){
                
        //         if(qun[i].users[ii].user==socket.username){
        //             console.log(qun[i].users[ii]);
        //             arr
        //         }
        //     }
        // }
        io.emit('gengxinqun',qname);
    })

    /**
     * 仿照sendMessage监听sendImg事件
     */
    socket.on("sendImg",(data)=>{
        for(let _user of users) {
            if(_user.username === data.username) {
                _user.dataUrl.push(data.dataUrl);
                //存储后将图片广播给所有浏览器
                io.emit("receiveImg",data);
                break;
            }
        }
    });

    socket.on('sendToOne',(data)=>{
        //判断该用户是否存在，如果存在就触发receiveToOne事件
        for (let _user of users) {
            if (_user.username === data.to) {
                _sockets[data.to].emit('receiveToOne',data);
                db.query("INSERT INTO `jilu` (`user`, `touser`, `message`) values('"+data.username+"','"+ data.to +"','"+data.text+"')",function(err,rows){
                    if(err){
                        res.send("新增失败"+err);
                    }else {
                        console.log('记录添加成功');
                    }
                });
            }
        }
    });

    // 群聊
    socket.on('qunsay',(data,msgmsg)=>{
        var msg={
            username:"群："+data+",用户："+socket.username,
            text:msgmsg,
        }
        for(var aa in qun){
            if(qun[aa].qname==data){
                for(var ii in qun[aa].users){
                    // 得到群聊中所有用户的名字
                    // 根据名字发送消息
                    _sockets[qun[aa].users[ii].user].emit('receiveToOne',msg);
                    
                }
                db.query("INSERT INTO `qun` (`qname`, `quser`, `qmessage`) VALUES ('"+data+"', '"+socket.username+"', '"+msgmsg+"')",function(err,rows){
                    if(err){
                        res.send("新增失败"+err);
                    }else {
                        console.log('群记录添加成功');
                    }
                });
            }
        }
    });
    socket.on('joinqun',(data)=>{
        var user={
            user:socket.username
        }
        var qunname;
        var u = 0;
        for(var i in qun){
            if(qun[i].qname==data){
                for(var ii in qun[i].users){
                    if(qun[i].users[ii].user==socket.username){
                        _sockets[socket.username].emit('joinqunmsg',"您已加入此群");
                        return;
                    }
                }
                qunname = qun[i].qname;
                qun[i].users.push(user);
                u++;
            }
        }

        if(u>0){
            var msg = {
                msg:"success",
                qun:qunname
            }
            _sockets[socket.username].emit('joinqunmsg',msg);
        }else if(u==0){
            io.emit('tongzhi','没有此群');
        }else if(u<0){
            io.emit('tongzhi','您以加入此群');
        }
        console.log(qun);
    });

    socket.on('getUser',()=>{
        console.log('获取全部人员');
        return users;
    });

    //断开连接后做的事情
    socket.on('disconnect',()=>{          //注意，该事件不需要自定义触发器，系统会自动调用
        usersNum --;
        console.log(`当前有${usersNum}个用户连接上服务器了`);

        //触发用户离开的监听
        socket.broadcast.emit("oneLeave",{username: socket.username});

        //删除用户
        users.forEach(function (user,index) {
            if(user.username === socket.username) {
                users.splice(index,1);       //找到该用户，删除
            }
        })
    })
});