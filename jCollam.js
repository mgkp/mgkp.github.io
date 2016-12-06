jCollam = new Object();

jCollam.useGradients = true;
jCollam.showProbabilities = true;
jCollam.showInternalIds = false;
jCollam.showExternalIds = false;

jCollam.onClickItem = null;
jCollam.onClickConnection = null;

jCollam.words=['supports','challenges'];

jCollam.draw = function(jQueryTarget, rootsOrText)
{
	if (typeof(rootsOrText)=='string')
		rootsOrText=jCollam.parse(rootsOrText);
	for(var i in rootsOrText)
		new jSplitTree(jQueryTarget,jCollam.getJSONTriple(rootsOrText[i],-1));
}

jCollam.parse = function(text)
{
	var struct=[];
	var lines=text.split("\n");
	jCollam.rootItems=[];
	jCollam.items={};
	for (var i in lines)
	{
		var line=lines[i];
		if (line.length==0)
			continue;
		var tabs=line.match(/^(\t*)/)[0].length+Math.floor(line.match(/^([ ]*)/)[0].length/2);
		line=line.replace(/^\s*/,'');
		//alert(line);
		jCollam.appendInDepth(struct,tabs,line);
	}
	var r;
	for(i in struct)
	{
		r = jCollam.processStruct(struct[i],null,null);
		//if (jCollam.rootItem!=null) jCollam.rootItem = r;
	}
	if (jCollam.rootItems.length==0)
		jCollam.rootItems=[r];
	return jCollam.rootItems;
}

jCollam.shownArguments={}; 
jCollam.shownConclusions={};
jCollam.clearTarget = function(target) { jCollam.shownArguments={}; jCollam.shownConclusions={}; target.empty(); }

jCollam.getCSSColor = function(v,rgb)
{
	var l=jCollam.useGradients?Math.floor(v*85):85;
	l=[170-l,170+l];
	for(var i in l) l[i]=l[i].toString(16);
	return '#'+l[rgb[0]]+l[rgb[1]]+l[rgb[2]];
}

{
	var nextID=0;
	function getNewId()
	{
		nextID++;
		var s='000000'+nextID;
		return s.substr(s.length-7);
	}
}

jCollam.Connection = function(argument,conclusion,probability)
{
	this._id=getNewId();
	this.argumentConns={};
	this.argument=argument;
	this.conclusion=conclusion;
	this.probability=probability;
}
jCollam.Connection.prototype.isArrowTarget=1;
/*jCollam.Connection.prototype.getconclusionConns=function()
{
	return {this.conclusion._id};
}*/
jCollam.Connection.prototype.calcProbability=function()
{
	var m=this.probability;
	//putline(.?{this.data->calcProbability()}); putline(.?{this.argument->getText(),this.conclusion->getText()});
	for(var a in this.argumentConns)
	{	m*=this.argumentConns[a].calcProbability();
	}
	return (this.probability<0?1.0:0.0)+(m*this.argument.calcProbability());
}
jCollam.Connection.prototype.getColor=function()
{
	var cp=this.calcProbability();
	return jCollam.getCSSColor(this.probability<0?1.0-cp:cp,this.probability<0?[1,0,0]:[0,1,0]);
}
jCollam.Connection.prototype.getText=function()
{
	var p=this.probability;
	return this.conclusion.isArrowTarget?(p>=0?jCollam.words[0]+(p==1.0?'':' '+p):jCollam.words[1]+(p==-1.0?'':' '+-p)):(p==1.0?null :''+p);
}

jCollam.Item = function()
{
	this._id=getNewId();
	this.argumentConns={};
	this.conclusionConns={};
}
jCollam.Item.prototype.isArrowTarget=0;
/*jCollam.Item.prototype.getconclusionConns=function()
{
	return this.conclusionConns;
}*/
jCollam.Item.prototype.calcProbability=function()
{
	var m=1.0;
	for(var a in this.argumentConns)
	{	m*=this.argumentConns[a].calcProbability();
	}
	return m;
}
jCollam.Item.prototype.getColor=function()
{
	var cp=this.calcProbability();
	return jCollam.getCSSColor(cp,cp<0?[1,0,0]:[0,1,0]);
}
jCollam.Item.prototype.getMetaTexts=function(prob)
{
	if (!jCollam.showProbabilities)
		return [];
	var a=[];//if you want to show internal id's, use [this._id];
	if (jCollam.showInternalIds)
		a.push(this._id.replace(/^0*/g,''));
	else if (jCollam.showExternalIds && this.id!=null)
		a.push(this.id);
	if (prob!=1.0)
		a.push('P&nbsp;'+jCollam.probabilityToString(prob));
	return a;
}
jCollam.probabilityToString = function(p)
{
	return p.toPrecision(4).replace(/(\.0)?0*$/,'$1');
}
jCollam.formatTextAndMetaTexts = function(text,metaTexts)
{
	var pt='';
	for(var i in metaTexts)
	{
		pt+='<div class="jCollam_MetaBox">'+metaTexts[i]+'</div>';
	}
	return pt+text;
}
jCollam.Item.prototype.getItemJSONProps=function()
{
	return { 'box': { 
				'text':jCollam.formatTextAndMetaTexts(this.getText(),this.getMetaTexts(this.calcProbability())),
				'color':this.getColor(), 
				'onClick': jCollam.onClickItem 
			}
		};
}

jCollam.Or = function()
{
	jCollam.Item.call(this);
}
jCollam.Or.prototype = new jCollam.Item;
jCollam.Or.prototype.calcProbability=function()
{
	var m=1.0;
	for(var a in this.argumentConns)
	{	m*=1.0-this.argumentConns[a].calcProbability();
	}
	return 1.0-m;
}
jCollam.Or.prototype.getText=function()
{
	return 'or';
}
jCollam.And = function()
{
	jCollam.Item.call(this);
}
jCollam.And.prototype = new jCollam.Item;
jCollam.And.prototype.getText=function()
{
	return 'and';
}

jCollam.Proposition = function(text,probability)
{
	jCollam.Item.call(this);
	this.text=text;
	this.probability=probability==null?1.0:probability;
}
jCollam.Proposition.prototype = new jCollam.Item;
jCollam.Proposition.prototype.calcProbability=function()
{
	return this.probability * jCollam.Item.prototype.calcProbability.call(this);
}
jCollam.Proposition.prototype.getText=function()
{
	return this.text;
}

jCollam.Proposition.prototype.isArrowTarget = 1;

jCollam.Proposition.prototype.getColor=function()
{
	var cp=this.calcProbability();
	return jCollam.getCSSColor(cp,[0,1,1]);
}

jCollam.Proposition.prototype.getMetaTexts=function(prob)
{	
	var a=jCollam.Item.prototype.getMetaTexts.call(this,prob);
	if (!jCollam.showProbabilities)
		return a;
	if (this.probability!=1.0)
	{
		for (var t in this.argumentConns) // this strange loop just to check whether array is nonempty
		{
			a[1]+='&nbsp;('+jCollam.probabilityToString(this.probability)+')'; // append to external probability
			break;
		}
	}
	return a;
}

jCollam.connectItems = function(argument,conclusion, strength)
{
	var c=new jCollam.Connection(argument,conclusion,strength);
	argument.conclusionConns[conclusion._id]=c;
	conclusion.argumentConns[argument._id]=c;
}

jCollam.setRepeatText= function(box) { box.text= box.text + ' (See above)'; }

jCollam.getJSONItemConclusionTree = function(item,level)
{
	if (!level)
		return [];
	var r=[];
	for (var i in item.conclusionConns)
	{
		var cc=item.conclusionConns[i];
		var c=cc.conclusion;
		//.c=item->getColor();
		if (c.prototype!=jCollam.Connection.prototype)
		{
			var ps=c.getItemJSONProps();
			ps.onClick = jCollam.onClickItem;
			ps.arrow=
				{
					'mode': (c.isArrowTarget*2)/*|(@$.key.argumentConns>1?4)|(level==1&&$.key.conclusionConns?8)*/,
					'color': cc.getColor(),
					//'urlTail': urlTailForConnection(item,$.key), 
					'text': cc.getText(),
					'onClick' : jCollam.onClickConnection
				};
			if( jCollam.shownConclusions[c._id])
			{	
				jCollam.setRepeatText(ps.box);
			}
			else
			{	
				jCollam.shownConclusions[c._id]=true;
				if( !jCollam.shownArguments[c._id])
					ps.metaChildren=jCollam.getJSONArgumentTree(cc,level-1);
				ps.children=jCollam.getJSONItemConclusionTree(c,level-1);
			}
			r.push( [ c._id, ps ] );
		}
	}
	r.sort();
	var rr=[];
	for(var ri in r)
	{	rr.push(r[ri][1]);
	}
	return rr;
}

jCollam.getJSONArgumentTree = function(object,level)
{
	if (!level)
		return [];
	var r=[];
	for (var i in object.argumentConns)
	{
//		alert(ps.box.text);
		var cc=object.argumentConns[i];
		var a=cc.argument;
		var ps=a.getItemJSONProps();
		{
			ps.arrow=
				{
					'mode': (object.isArrowTarget?1:0)/*|(@$.key.argumentConns>1?4)|(level==1&&$.key.conclusionConns?8)*/,
					'color': cc.getColor(),
					//'urlTail': urlTailForConnection(item,$.key), 
					'text': cc.getText(),
					'onClick' : jCollam.onClickConnection
				};
			if( jCollam.shownArguments[a._id])
			{	
				jCollam.setRepeatText(ps.box);
			}
			else
			{	
				jCollam.shownArguments[a._id]=true;
				if( !jCollam.shownConclusions[a._id])
					ps.metaChildren=jCollam.getJSONArgumentTree(cc,level-1);
				ps.children=jCollam.getJSONArgumentTree(a,level-1);
			}
			r.push( [ a._id, ps ] );
		}
	}
	r.sort();
	var rr=[];
	for(var ri in r)
	{	rr.push(r[ri][1]);
	}
	return rr;
}

jCollam.getJSONTriple = function(center,level)
{
	var cb=center.getItemJSONProps().box;
	var t=jCollam.shownConclusions[center._id];
	var b=jCollam.shownArguments[center._id];
	jCollam.shownConclusions[center._id]=true;
	jCollam.shownArguments[center._id]=true;
	if (t||b) 
		jCollam.setRepeatText(cb);
	return {
		'topTree': t?[]:jCollam.getJSONItemConclusionTree(center,level-1),
		'root': cb,//+{(level==1&&getValidconclusionConns(center)?8)|(level==1&&getValidArgs(center)?16)},
		'bottomTree': b?[]:jCollam.getJSONArgumentTree(center,level-1)
	};
}

jCollam.processStruct = function(struct, parent,grandParent)
{
	var elems=/^(\*?)(<?)([+\-]?)((?:[01]\.?[0-9]*)?) *((?:\[[01]\.?[0-9]*\])?) *((?:\#[^ ]+)?) *(.*)/.exec(struct[0]);
	if (elems.length<2)
		return;
	var id = elems[6]!='' ? elems[6].substr(1) : null;
	
	var  item=elems[7]=='' ? jCollam.items[id] : 
	(
		/^or$/i.test(elems[7]) ? new jCollam.Or() : 
		(
			/^and$/i.test(elems[7]) ? new jCollam.And() : new jCollam.Proposition(elems[7]) 
		) 
	);
	if (id!=null)
	{	item.id=id;
		jCollam.items[id]=item;
	}
	if (elems[1]=='*')
		jCollam.rootItems.push(item);
	if (elems[5]!='')
		item.probability=parseFloat(elems[5].substr(1));
	var strength=(elems[3]=='-'?-1.0:1.0) * (elems[4]=='' ? 1.0: parseFloat(elems[4]));
	if (elems[2]=='<')
	{	jCollam.connectItems(item,parent.conclusionConns[grandParent._id],strength);
	}
	else
	{
		if (parent!=null)
		{	//alert(item.text);
			//alert(parent.text);
			jCollam.connectItems(item,parent,strength);
		}
	}
	for (var i in struct[1])
		jCollam.processStruct(struct[1][i],item,parent);
	return item; 
}

jCollam.appendInDepth = function(struct,depth,item)
{
	var s=struct;
	for(var i=0; i<depth*2; i++)
	{	s=s[s.length-1];
	}
	s.push([item,[]]);
}
