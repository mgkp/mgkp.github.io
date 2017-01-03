function jLineFactory(container)
{
	this.container = container;
}

jLineFactory.prototype = {

	sign: function(v)
	{	return v>0?1:(v<0?-1:0);
	},

	createRect: function(x,y,width,height,color) {
		var e=$("<div>");
		if (color!=null)
			e.css("backgroundColor", color);
		e.css({
			position:'absolute',
			padding:'0',
			left:x,
			top:y,
			width:width,
			height:height
			});
		return e;
	},
	createArrowFromTop: function(x,y,width,height,color,direction/*0=up,right,top,down*/) {
		return this.createPositionedArrow(x-[width/2,height,width/2,height][direction],y-[height,width/2,height,width/2][direction],width,height,color,direction);
	},
	createArrowFromBase: function(x,y,width,height,color,direction/*0=up,right,top,down*/) {
		return this.createPositionedArrow(x-[width/2,0,width/2,height*2][direction],y-[height*2,width/2,0,width/2][direction],width,height,color,direction);
	},
	createPositionedArrow: function(x,y,dwidth,dheight,color,direction/*0=up,right,top,down*/) {
		var aw,ah;
		dwidth/=2; //due to the way we use corners
		if ((direction%2)==0) {
			aw=dwidth; ah=dheight;
		} else {
			aw=dheight; ah=dwidth;
		}
		return this.createRect(x,y,0,0).css({
			border: "1px solid rgba(0,0,0,0)",
			borderTopWidth: ah, 
			borderBottomWidth: ah, 
			borderLeftWidth: aw, 
			borderRightWidth: aw,
		}).css("border"+["Bottom","Left","Top","Right"][direction]+"Color",color);
	},
	save: function(r) {
		this.container.append(r);
	},
	drawCurvedLine: function(startPos,deltas,color,width, defaultRadius, startArrowSize,endArrowSize) {
		var pos=startPos.slice(0);
		var prevOffset=startArrowSize;
		for (var i=0; i<deltas.length;i++) {
			d=deltas[i];
			var radius=d[2]!=null?d[2]:defaultRadius;
			this.drawArrowedCurvedLineSegment(pos,d,deltas[i+1], color, width, radius, prevOffset, i==0?startArrowSize: 0, (i==deltas.length-1)?endArrowSize : 0,i==0);
			prevOffset=radius;
			pos[0]+=d[0];
			pos[1]+=d[1];
		}
	},

	drawArrowedCurvedLineSegment: function(pos, delta,nextDelta, color, width, radius, prevOffset, startArrowSize,endArrowSize) {
		var dim=delta[0]!=0?0:1;
		delta=delta.slice(0);
		var lenReduction=0;
		var dir=delta[0]>0?1:(delta[0]<0?3:(delta[1]<0?0:2));
		if (startArrowSize)
			this.save(this.createArrowFromTop(pos[0],pos[1],startArrowSize+width,startArrowSize,color,(dir+2)%4));
		if (endArrowSize)
			this.save(this.createArrowFromTop(pos[0]+delta[0],pos[1]+delta[1],endArrowSize+width,endArrowSize,color,dir));

		var lenSign=this.sign(delta[dim]);
		if (prevOffset) {
			pos=pos.slice(0);
			lenReduction=prevOffset*lenSign;
			pos[dim]+=lenReduction;
		}
		if (endArrowSize) {
			lenReduction+=endArrowSize*lenSign;
		}
		delta[dim]-=lenReduction;
		this.drawCurvedLineSegment(pos, delta,nextDelta, color, width, radius);
	},

	drawCurvedLineSegment: function(pos, delta,nextDelta, color, width, radius) {
		//var isHor=delta[0]!=0;
		var dx=delta[0];
		var dy=delta[1]; // at least one of the operands of + is always zero
		var ndx=0;
		var ndy=0;
		if (nextDelta!=null) {
			ndx=this.sign(nextDelta[0])*radius;
			ndy=this.sign(nextDelta[1])*radius;
		}
		var x=pos[0]+Math.min(0,dx+ndx);
		var y=pos[1]+Math.min(0,dy+ndy);
		var e=this.drawPositionedCurvedLineSegment(x,y,dx,dy,ndx,ndy,color,width,radius);
	},

	drawPositionedCurvedLineSegment: function(x,y,dx,dy,ndx,ndy,color,width,radius) {
		var lrWord=ndx<0||(dx>0&&ndy!=0)?"Right" :(ndx>0||(dx<0&&ndy!=0)||dy!=0?"Left":null);
		var tbWord=ndy<0||(dy>0&&ndx!=0)?"Bottom":(ndy>0||(dy<0&&ndx!=0)||dx!=0?"Top" :null);
		var w=Math.abs(dx+ndx),h=Math.abs(dy+ndy);
		if (tbWord!=null&&lrWord!=null) {
			w-=width/2;
			h-=width/2;
		}
		if (tbWord=="Top")
			y-=width/2;
		if (lrWord=="Left")
			x-=width/2;
		var e=this.createRect(x,y,w,h);
		e.css({
			borderColor:color,
			borderStyle:"solid",
			borderWidth:0,
			borderRadius:0
		});
		if (lrWord!=null)
			e.css("border"+lrWord+"Width",width);
		if (tbWord!=null)
			e.css("border"+tbWord+"Width",width);
		if (lrWord!=null&&tbWord!=null)
			e.css("border"+tbWord+lrWord+"Radius",radius);
		this.save(e);
	}
}