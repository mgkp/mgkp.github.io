---
layout: default4argmap
category: argmaps
title: "test"
date: 2017-01-04
---

<script>
var textObj;

function init()
{
        var str="Bruno can be taken for for a walk\n\
	* #1 Bruno is happy and healthy\n\
		+ and\n\
			[0.7] Bruno seems to wag his tail\n\
			Bruno is a dog\n\
			A happy dog is wagging its tail\n\
				- Sometimes, a dog is wagging its tail in anticipation instead\n\
		- Bruno's boss is not happy now\n\
			<- A dogs happiness is not affected by the emotional state of its boss\n\
		+ Bruno had his health check yesterday and nothing was found\n\
Bruno's boss does not have to worry\n\
	#1\n\
";
	
        textObj=document.getElementById('test');
	textObj.value=str.replace(/\t/g,"  ");
	update();
}
</script>
