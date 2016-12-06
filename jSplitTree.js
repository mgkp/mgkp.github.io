//TODO: minimal width of item due to arrows

function jSplitTree(jQuertyTarget,splitTree) // splitTree == { 'topTree': , 'root':, 'bottomTree' } 
{
	this.conns=[];
	this.container=$("<div></div>");
	var center=jSplitTree.makeItemBox(splitTree.root);
	this.genItems(splitTree.topTree,true,0,false,center);
	this.container.append(center).append($('<br>'));
	this.genItems(splitTree.bottomTree,false,0,false,center);
	jQuertyTarget.append(this.container);
	this.drawConns(jQuertyTarget);
}

jSplitTree.lineMargin=20;
jSplitTree.lineWidth=5;
jSplitTree.lineOffset=jSplitTree.lineMargin/2;
jSplitTree.arrowSize=9;

jSplitTree.makeItemBox= function(props)
{
	return $("<div></div>").addClass('ViSpi_box').css('background-color',props.color)
		.append($("<div></div>").addClass('ViSpi_itemText').html(props.text))
		.click(function() { props.onClick(this); } );
}

jSplitTree.conns;//x,w,s,d,isMeta,color
jSplitTree.setClick=function(target,object)
{
	if (object.onClick!=null)
	{	target.addEventListener('click',function(event) { object.onClick(target); event.stopPropagation(); },false);
		target.style.cursor="pointer";
	}
}

jSplitTree.prototype.genItems= function(tree,backwards,parentOffset,isMeta,parent)
{
	var i;
	var boxOffset=parentOffset+jSplitTree.lineMargin*tree.length+jSplitTree.lineOffset;
	for(i in tree)
	{
		var props=tree[i];
		if (props.children==null) props.children=[];
		if (props.metaChildren==null) props.metaChildren=[];
		var box=jSplitTree.makeItemBox(props.box);
		box.css('min-width', jSplitTree.lineMargin*props.children.length);
		var arrowText=null;
		var offset=boxOffset;
		var connOffset=parentOffset+(jSplitTree.lineMargin)*(backwards?i: tree.length-i-1)+jSplitTree.lineOffset;
		var w=boxOffset-connOffset;
		var minW=jSplitTree.lineMargin*props.metaChildren.length+10;
		if (w<minW) { offset+=minW-w; w=minW; }
		box.css('margin-left',offset);
		if (props.arrow.text!=null) {
			arrowText=$("<div></div>").addClass('ViSpi_arrowText');
			arrowText.click(function() { props.arrow.onClick(this); } );
			arrowText.css({
				'margin-top': !backwards&&(props.arrow.mode&1)&&i==0?10:0, 
				'margin-left': connOffset-8,
				'background-color': props.arrow.color
			}).html(props.arrow.text);
		}
		this.conns.push({'s':parent,'w':w,'d':box,'isMeta':isMeta,'props':props.arrow });
		if (backwards) {
			this.genItems(props.children,backwards,offset,false,box);
			this.container.append(box).append($('<br>'));
			this.genItems(props.metaChildren,false,connOffset,true,box);
			if (arrowText!=null) {
				this.container.append(arrowText).append($('<br>'));
			}
		}
		else
		{	
			if (arrowText!=null) {
				this.container.append(arrowText).append($('<br>'));
			}
			this.container.append(box).append($('<br>'))
			this.genItems(props.children,backwards,offset,false,box);
			this.genItems(props.metaChildren,false,connOffset,true,box);
		}
		//document.write();
	}
}

jSplitTree.prototype.drawConns = function(container)
{
	var lf=new jLineFactory(container);
	for(c in this.conns) {
		var co = this.conns[c];
		var sOffset=co.s.offset(), dOffset=co.d.offset();
		var h=co.d.height()+8;
		var backwards=co.s!=null && sOffset.top>dOffset.top;
		var hOffset = co.isMeta ? jSplitTree.lineWidth/2 : (backwards ? -h/2 : h/2);
		lf.drawCurvedLine(
			[dOffset.left,dOffset.top+h/2],
			[[-co.w,0],[0,sOffset.top-dOffset.top+hOffset]],
			co.props.color,
			jSplitTree.lineWidth,
			jSplitTree.lineWidth*2,
			backwards?jSplitTree.arrowSize:0,
			backwards?0:jSplitTree.arrowSize
		 );
	}
}
