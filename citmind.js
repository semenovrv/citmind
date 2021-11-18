const	 path		=	require('path')
		,mime		=	require('mime')
		,parseurl	=	require('parseurl')
		,connect	=	require('connect')
		,qs			=	require('qs')
		,WebSocket	=	require('ws')
		,sstatic	=	require('serve-static')
		,session	=	require('express-session')({
			'cookie':{'path':'/','httpOnly':false,'secure':false,'maxAge':50000}  // use trust-proxy for secure=true
			,'name':'citmind.sid'
			,'rolling':true
			,'resave':true
			,'secret':'citmind'
			,'saveUninitialized':false
			})
		

const WWW={
 'root':		{'path':'/','dir':path.join(__dirname,'httproot')}
,'port':		process.argv[2]
,'broadcast':function(...ppp){
	const data=JSON.stringify(ppp.reduce((dd,vv)=>Object.assign(dd,vv),{}))
	wss.clients.forEach(cc=>(cc.readyState===WebSocket.OPEN)&&cc.send(data))
}
};

	

function serveDir(dir){return[dir,sstatic(path.join(WWW.root.dir,dir))]}
const app=connect()
	.use(...serveDir('/js/'))
	.use(...serveDir('/css/'))
	.use(...serveDir('/pic/'))
	.use((req,res,next)=>{
		req.query=~req.url.indexOf('?')?qs.parse(parseurl(req).query):{};
		req.citm={get['query'](){return req.method==='POST'?req.body:req.query},'sqlite3':{}}
		res.citm={	 'writeHead':	(cc)=>(res.writeHead(cc||200,{'Content-Type':mime.getType('json')}),res.citm)
					,'end':			dd=>res.end(...(dd?[JSON.stringify(dd)]:[]))
					,'endErr':		err=>{res.citm.writeHead(500).end(err=err.message||err);console.error(err.message||JSON.stringify(err))}
					,'forbid':		msg=>res.writeHead(403).end(msg||'Action is forbidden!')
					,'error':		msg=>res.writeHead(500).end(msg)
					,'proceed':		msg=>res.writeHead(200).end(msg)
					,'addPromise':	function(pp,rt){this._promise=this._promise?this._promise.then(dd=>pp):pp;if(rt)req.url=rt}
		};next()})
	.use(session)
	.use(sstatic(WWW.root.dir))
	.use((req,res,next)=>console.error('not served!',req.url,WWW.root.dir)||next())
,http=require('http').Server(app)
,wss=new WebSocket.Server({'server':http}).on('connection',(ws,req)=>{
	let pwd='';
	function send(dd){ws.send(JSON.stringify(dd))}
	ws.on('message',(msg,...bbb)=>{
		const data=JSON.parse(msg);
		if('key'in data)pwd+=data.key;
		else if('complete'in data)new Promise((rs,rj)=>{
			const usr=WWW.users.get('');pwd='';
			if(usr){
			const res={'headers':{}
					,'getHeader':nn=>res.headers[nn],'setHeader':(nn,vv)=>((res.headers[nn]=vv),res),'writeHead':()=>res,'end':()=>rs(res)};
				session(req,res,()=>res.writeHead(req.session.user=usr).end())
			}else rj({'auth':'failed'})
		}).then(res=>send(res.headers),err=>{console.error(err);send({'error':err})})
	})
})


//fsp.readFile('users.json').then(data=>{
//	WWW.users=new Map(JSON.parse(data))
http.listen(WWW.port,()=>console.log(new Date(),'Citmind started:',WWW.port));
//},console.error);

function userGroup(user,groups){return!(user&&user.groups||[]).every(g=>!groups.has(g))}
const GROUPS={
 'permit':{
	  'path':(path,user)=>	new Promise((rs,rj)=>(path&&userGroup(user,path.groups)?rs:rj)(path))
	 ,'mode':		user=>	userGroup(user,new Set(['heaters','admins']))
 }
}

