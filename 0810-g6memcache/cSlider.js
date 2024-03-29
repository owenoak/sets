/* 
	Copyright (c) 2005 Metablocks, Inc, Metablocks, Ltd. and their affiliates. 
	Not to be reused without permission. All Rights Reserved.
*/

/*
 	cSlider class
*/

if (!cObjects) {
    var cObjects = [];
}
;
function cSlider(theFieldnamePrefix) {
    this._objectId;
    this.fieldName;
    this.fieldName2;
    this._disabled = false;
    this.direction = 0;
    this.width = 100;
    this.height = 20;
    this.minVal = 0;
    this.maxVal = 100;
    this.minVal2 = 0;
    this.maxVal2 = 100;
    this.valueDefault = 0;
    this.valueDefault2 = 0;
    this.arrowAmount = 1;
    this.arrowMouseOver = false;
    this.arrowKeepFiringTimeout = 10;
    this._stopFireArrowFlag = false;
    this.wheelAmount = 5;
    this.colorbar;
    this.colorbar2;
    this.baseZindex = 1000;
    this.moveX = 0;
    this.moveY = 0;
    this.imgBasePath;
    this.imgDir = '/images/cSlider/';
    this._bgImgSrc;
    this._bgImgRepeat;
    this._bgImgCssStyle;
    this._bgImgLeftSrc;
    this._bgImgLeftWidth;
    this._bgImgLeftHeight;
    this._bgImgRightSrc;
    this._bgImgRightWidth;
    this._bgImgRightHeight;
    this._sliderImgSrc;
    this._sliderImgWidth;
    this._sliderImgHeight;
    this.styleContainerClass;
    this.styleValueFieldClass = 'smalltxt spanSliderField';
    this.styleValueFieldClass2 = 'smalltxt spanSliderField';
    this.styleValueTextClass = 'smalltxt spanSliderText';
    this.styleValueTextClass2 = 'smalltxt spanSliderText';
    this.bgColor;
    this._arrowIconLeftSrc;
    this._arrowIconLeftWidth = 0;
    this._arrowIconLeftHeight = 0;
    this._arrowIconLeftCssStyle = 0;
    this._arrowIconRightSrc;
    this._arrowIconRightWidth = 0;
    this._arrowIconRightHeight = 0;
    this._arrowIconRightCssStyle = 0;
    this.useInputField = 2;
    this.useInputField2 = 2;
    this.inputTextFieldEvent = 'over';
    this.useSecondKnob;
    this.preventValueCrossing;
    this.ctrl;
    this.ctrl2;
    this._valueInternal;
    this._valueInternal2;
    this._display = 2;
    this._arrowLeftContainerId;
    this._arrowLeftContainerObj;
    this._arrowLeftIconId;
    this._arrowLeftIconObj;
    this._arrowRightContainerId;
    this._arrowRightContainerObj;
    this._arrowRightIconId;
    this._arrowRightIconObj;
    this._valueContainerId;
    this._valueContainerObj;
    this._handleId;
    this._handleObj;
    this._valueFieldId;
    this._valueFieldObj;
    this._valueFieldObj2;
    this._valueTextId;
    this._valueTextObj;
    this._valueTextObj2;
    this._slideBarId;
    this._slideBarObj;
    this._colorbarId;
    this._colorbarObj;
    this._colorbarObj2;
    this._posUpperLeftX;
    this._posUpperLeftY;
    this._posSlideStart;
    this._posSlideEnd;
    this._slideWidth;
    this._attachedEvents;
    this.eventOnChange;
    this.slideStartCB;
    this.slideMoveCB;
    this.slideEndCB = false;
    this.increment = 1.0000;
    this.increment2 = 1.0000;
    
    this._constructor = function(theFieldnamePrefix) {
        this._id = cObjects.length;
        cObjects[this._id] = this;
        this._objectId = "cSlider_" + this._id;
        this.objectName = this._objectId;
        if (typeof(theFieldnamePrefix) == 'string') {
            this.fieldName = theFieldnamePrefix + '_value';
            this.fieldName2 = theFieldnamePrefix + '2_value';
            this.objectName = theFieldnamePrefix;
        }
    }
    this._checkup = function() {
        if (typeof(this.minVal) == 'undefined') this.minVal = 0;
        if (typeof(this.maxVal) == 'undefined') this.maxVal = 10;
        if (typeof(this.valueDefault) == 'undefined') this.valueDefault = this.minVal;
        this._valueInternal = this.valueDefault;
        if (this.useSecondKnob) {
            if (typeof(this.minVal2) == 'undefined') this.minVal2 = 0;
            if (typeof(this.maxVal2) == 'undefined') this.maxVal2 = 10;
            if (typeof(this.valueDefault2) == 'undefined') this.valueDefault2 = this.maxVal2;
            this._valueInternal2 = this.valueDefault2;
        }
        if (typeof(this.imgBasePath) == 'string')  this.imgDir = this.imgBasePath;
    }
    this.loadSkin = function(skinName) {
        switch (skinName) {
            case 'default':
                this.useInputField = 0;
                this.height = "24";
                this.imgDir = '/images/cSlider/';
                this.setSliderIcon('horizontal_handle.gif', 11, 24);
                this.setBackgroundImage('horizontal_background.gif', 'repeat');
                this.setBackgroundImageLeft('horizontal_backgroundLeft.gif', 1, 19);
                this.setBackgroundImageRight('horizontal_backgroundRight.gif', 1, 19);
                break;
			case 'streak':
                this.useInputField = 0;
			    this.height = 24;
				this.imgDir = '/images/cSlider/';
				this.setSliderIcon('horizontal_handle.gif', 11, 24);
				this.setBackgroundImage('horizontal_background.gif', 'repeat');
                this.setBackgroundImageLeft('horizontal_backgroundLeft.gif', 1, 19);
                this.setBackgroundImageRight('horizontal_backgroundRight.gif', 1, 19);
				this.colorbar = new Object();
				this.colorbar['color'] = '#BBBBFF';
				this.colorbar['height'] = 3;
				this.colorbar['widthDifference'] = 0;
				this.colorbar['offsetLeft'] = 0;
				this.colorbar['offsetTop'] = 6;
				break;	
		    case 'range':	
		        this.useInputField = 0;
		        this.useInputField2 = 0;
			    this.height = 24;
				this.imgDir = '/images/cSlider/';
				this.useSecondKnob = true;
				this.preventValueCrossing = true;
				this.setSliderIcon('horizontal_handle.gif', 11, 24);
				this.setSliderIcon2('horizontal_handle.gif', 11, 24);
				this.setBackgroundImage('horizontal_backgroundRange.gif', 'repeat');
                this.setBackgroundImageLeft('horizontal_backgroundLeft.gif', 1, 19);
                this.setBackgroundImageRight('horizontal_backgroundRight.gif', 1, 19);
                this.colorbar = new Object();
				this.colorbar['color'] = '#FFFFFF';
				this.colorbar['height'] = 3;
				this.colorbar['widthDifference'] = 0;
				this.colorbar['offsetLeft'] = 0;
				this.colorbar['offsetTop'] = 6;
                this.colorbar2	= new Object();
				this.colorbar2['color'] = '#FFFFFF';
				this.colorbar2['height'] = 3;
				this.colorbar2['widthDifference'] = 0;
				this.colorbar2['offsetLeft'] = 0;
				if (navigator.userAgent.indexOf('MSIE')!=-1) this.colorbar2['offsetLeft'] = 1;
				this.colorbar2['offsetTop'] = 6;
				break;	
            default:
            return false;}
        return true;
    }
    this.render = function(tagId) {
        this._checkup();
        this._containerId = 'co' + tagId;
        this._handleId = 'po' + tagId;
        this._arrowLeftContainerId = 'alc' + tagId;
        this._arrowLeftIconId = 'ali' + tagId;
        this._arrowRightContainerId = 'arc' + tagId;
        this._arrowRightIconId = 'ari' + tagId;
        this._valueContainerId = 'vc' + tagId;
        this._valueFieldId = 'vf' + tagId;
        if (typeof(this.fieldName) == 'undefined') this.fieldName = tagId + '_value';
        if (typeof(this.fieldName2) == 'undefined') this.fieldName = tagId + '2_value';
        this._valueTextId = 'vt' + tagId;
        this._slideBarId = 'bar' + tagId;
        this._colorbarId = 'cb' + tagId;
        var divWidth = this.width;
        var divHeight = this.height;
        var out = new Array();
        var outI = 0;
        var localOffset = 0;
        out[outI++] = '<div id="' + this._containerId + '"';
        if (this.styleContainerClass) {
            out[outI++] = ' class="' + this.styleContainerClass + '"';
        }
        out[outI++] = ' style="position:relative;';
        if (this._display == 0) {
            out[outI++] = ' display:none;';
        } else if (this._display == 1) {
            out[outI++] = ' visibility:hidden;';
        }
        out[outI++] = ' onmousewheel="cObjects[' + this._id + '].onMouseWheel(); return false;"';
        out[outI++] = '">';
        out[outI++] = '<div';
        out[outI++] = ' onmousewheel="cObjects[' + this._id + '].onMouseWheel(); return false;"';
        out[outI++] = ' style="position:absolute; left:' + this.moveX + 'px; top:' + this.moveY + 'px;">';
        if (this.useSecondKnob) {
            out[outI++] = this._renderInputFieldAndText(localOffset, 1);
        }
        out[outI++] = '<div style="position:absolute; display:none; z-index:' + (this.baseZindex + 10) + ';" id="' + this._handleId + '">';
        out[outI++] = '<img id="poImg' + tagId + '" src="' + this.imgDir + this._sliderImgSrc + '" border="0" width="' + this._sliderImgWidth + '" height="' + this._sliderImgHeight + '" />';
        out[outI++] = '</div>';
        if (this.useSecondKnob) {
            out[outI++] = '<div style="position:absolute; display:none; z-index:' + (this.baseZindex + 9) + ';" id="' + this._handleId + '2">';
            out[outI++] = '<img id="poImg' + tagId + '2" src="' + this.imgDir + this._sliderImgSrc2 + '" border="0" width="' + this._sliderImgWidth + '" height="' + this._sliderImgHeight + '" />';
            out[outI++] = '</div>';
        }
        if ((this.arrowAmount > 0) && this._arrowIconLeftSrc) {
            out[outI++] = '<div id="' + this._arrowLeftContainerId + '" style="position:absolute; left:' + localOffset + 'px; top:0px;">';
            out[outI++] = '<a href="javascript:void(false);"';
            if (this.arrowMouseOver) {
                out[outI++] = ' onmouseover="cObjects[' + this._id + '].onChangeByArrow(false, true); return false;"';
                out[outI++] = ' onmouseout="cObjects[' + this._id + '].stopFireArrow(); return false;"';
            } else {
                out[outI++] = ' onmousedown="cObjects[' + this._id + '].onChangeByArrow(false, true); return false;"';
                out[outI++] = ' onmouseup="cObjects[' + this._id + '].stopFireArrow(); return false;"';
                out[outI++] = ' onmouseout="cObjects[' + this._id + '].stopFireArrow(); return false;"';
            }
            out[outI++] = '>';
            out[outI++] = '<img id="' + this._arrowLeftIconId + '" src="' + this.imgDir + this._arrowIconLeftSrc + '" border="0" width="' + this._arrowIconLeftWidth + '" height="' + this._arrowIconLeftHeight + '"';
            if (typeof(this.arrowIconLeftCssStyle) != 'undefined') {
                out[outI++] = ' style="' + this.arrowIconLeftCssStyle + '"';
            }
            out[outI++] = ' />';
            out[outI++] = '</a></div>';
            localOffset += this._arrowIconLeftWidth;
        }
        if (typeof(this._bgImgLeftSrc) != 'undefined') {
            var tmpLeft = (this.direction == 0) ? localOffset : 0;
            var tmpTop = (this.direction == 0) ? 0 : localOffset;
            out[outI++] = '<div style="position:absolute; left:' + tmpLeft + 'px; top:' + tmpTop + 'px;">';
            out[outI++] = '<img src="' + this.imgDir + this._bgImgLeftSrc + '" width="' + this._bgImgLeftWidth + '" height="' + this._bgImgLeftHeight + '" border="0" />';
            out[outI++] = '</div>';
            localOffset += (this.direction == 0) ? this._bgImgLeftWidth : this._bgImgLeftHeight;
        }
        if (this.colorbar) {
            out[outI++] = '<div id="' + this._colorbarId + '" onclick="cObjects[' + this._id + '].onChangeByClick(event);"';
            if (this.colorbar['cssClass']) {
                out[outI++] = ' class="' + this.colorbar['cssClass'] + '"';
            }
            out[outI++] = ' style="position:absolute; z-index:' + (this.baseZindex + 5) + '; width:0px;';
            if ('undefined' != typeof(this.colorbar['color'])) {
                out[outI++] = ' background-color:' + this.colorbar['color'] + ';';
            } else if ('undefined' == typeof(this.colorbar['cssClass'])) {
                out[outI++] = ' background-color:orange;';
            }
            if ('undefined' != typeof(this.colorbar['offsetLeft'])) {
                out[outI++] = ' left:' + (localOffset + this.colorbar['offsetLeft']) + 'px;';
            }
            if ('undefined' != typeof(this.colorbar['offsetTop'])) {
                out[outI++] = ' top:' + this.colorbar['offsetTop'] + 'px;';
            }
            if ('undefined' != typeof(this.colorbar['height'])) {
                out[outI++] = ' height:' + this.colorbar['height'] + 'px;';
            }
            out[outI++] = '">';
            out[outI++] = '<img src="'+this.imgDir+'spacer.gif" width="1" height="3" /></div>';
        }
        if (this.colorbar2) {
            out[outI++] = '<div id="' + this._colorbarId + '2" onclick="cObjects[' + this._id + '].onChangeByClick(event);"';
            if (this.colorbar2['cssClass']) {
                out[outI++] = ' class="' + this.colorbar2['cssClass'] + '"';
            }
            out[outI++] = ' style="position:absolute; z-index:' + (this.baseZindex + 5) + '; width:0px;';
            if ('undefined' != typeof(this.colorbar2['color'])) {
                out[outI++] = ' background-color:' + this.colorbar2['color'] + ';';
            } else if ('undefined' == typeof(this.colorbar2['cssClass'])) {
                out[outI++] = ' background-color:orange;';
            }
            if ('undefined' != typeof(this.colorbar2['offsetLeft'])) {
                out[outI++] = ' left:' + (localOffset + this.colorbar2['offsetLeft']) + 'px;';
            }
            if ('undefined' != typeof(this.colorbar2['offsetTop'])) {
                out[outI++] = ' top:' + this.colorbar2['offsetTop'] + 'px;';
            }
            if ('undefined' != typeof(this.colorbar2['height'])) {
                out[outI++] = ' height:' + this.colorbar2['height'] + 'px;';
            }
            out[outI++] = '">';
            out[outI++] = '<img src="'+this.imgDir+'spacer.gif" width="1" height="3" /></div>';
        }
        out[outI++] = '<div id="' + this._slideBarId + '" onclick="cObjects[' + this._id + '].onChangeByClick(event);"';
        var tmpLeft = (this.direction == 0) ? localOffset : 0;
        var tmpTop = (this.direction == 0) ? 0 : localOffset;
        out[outI++] = ' style="position:absolute; left:' + tmpLeft + 'px; top:' + tmpTop + 'px; width:' + divWidth + 'px; height: ' + divHeight + 'px; clip:rect(0 ' + divWidth + '  ' + divHeight + ' 0);';
        if (this.bgColor) {
            out[outI++] = 'background-color:' + this.bgColor + '; layer-background-color:' + this.bgColor + ';';
        }
        if (this._bgImgSrc) {
            out[outI++] = ' background-image: url(' + this.imgDir + this._bgImgSrc + '); background-repeat:' + this._bgImgRepeat + ';';
        }
        if (this._bgImgCssStyle) {
            out[outI++] = this._bgImgCssStyle;
        }
        out[outI++] = '"></div>';
        localOffset += (this.direction == 0) ? this.width : this.height;
        if (typeof(this._bgImgRightSrc) != 'undefined') {
            var tmpLeft = (this.direction == 0) ? localOffset : 0;
            var tmpTop = (this.direction == 0) ? 0           : localOffset;
            out[outI++] = '<div style="position:absolute; left:' + tmpLeft + 'px; top:' + tmpTop + 'px;">';
            out[outI++] = '<img src="' + this.imgDir + this._bgImgRightSrc + '" width="' + this._bgImgRightWidth + '" height="' + this._bgImgRightHeight + '" border="0" />';
            out[outI++] = '</div>';
            localOffset += (this.direction == 0) ? this._bgImgRightWidth : this._bgImgRightHeight;
        }
        if ((this.arrowAmount > 0) && this._arrowIconRightSrc) {
            var tmpLeft = (this.direction == 0) ? localOffset : 0;
            var tmpTop = (this.direction == 0) ? 0           : localOffset;
            out[outI++] = '<div id="' + this._arrowRightContainerId + '" style="position:absolute; left:' + tmpLeft + 'px; top:' + tmpTop + 'px;">';
            out[outI++] = '<a href="javascript:void(false);"';
            if (this.arrowMouseOver) {
                out[outI++] = ' onmouseover="cObjects[' + this._id + '].onChangeByArrow(true, true); return false;"';
                out[outI++] = ' onmouseout="cObjects[' + this._id + '].stopFireArrow(); return false;"';
            } else {
                out[outI++] = ' onmousedown="cObjects[' + this._id + '].onChangeByArrow(true, true); return false;"';
                out[outI++] = ' onmouseup="cObjects[' + this._id + '].stopFireArrow(); return false;"';
                out[outI++] = ' onmouseout="cObjects[' + this._id + '].stopFireArrow(); return false;"';
            }
            out[outI++] = '>';
            out[outI++] = '<img id="' + this._arrowRightIconId + '" src="' + this.imgDir + this._arrowIconRightSrc + '" border="0" width="' + this._arrowIconRightWidth + '" height="' + this._arrowIconRightHeight + '"';
            if (typeof(this.arrowIconRightCssStyle) != 'undefined') {
                out[outI++] = ' style="' + this.arrowIconRightCssStyle + '"';
            }
            out[outI++] = ' />';
            out[outI++] = '</a></div>';
            localOffset += this._arrowIconRightWidth;
        }
        if (this.useSecondKnob) {
            out[outI++] = this._renderInputFieldAndText(localOffset, 2);
        } else {
            out[outI++] = this._renderInputFieldAndText(localOffset, 1);
        }
        out[outI++] = '</div>';
        out[outI++] = '</div>';
        document.getElementById(tagId).innerHTML = out.join('');
        this._containerObj = document.getElementById(this._containerId);
        this._arrowLeftContainerObj = document.getElementById(this._arrowLeftContainerId);
        this._arrowLeftIconObj = document.getElementById(this._arrowLeftIconId);
        this._arrowRightContainerObj = document.getElementById(this._arrowRightContainerId);
        this._arrowRightIconObj = document.getElementById(this._arrowRightIconId);
        this._slideBarObj = document.getElementById(this._slideBarId);
        this._handleObj = document.getElementById(this._handleId);
        this._valueContainerObj = document.getElementById(this._valueContainerId);
        this._valueFieldObj = document.getElementById(this._valueFieldId);
        this._valueTextObj = document.getElementById(this._valueTextId);
        this._colorbarObj = document.getElementById(this._colorbarId);
        this._posSlideStart = (this.direction == 0) ? getDivLeft(this._slideBarObj) : getDivTop(this._slideBarObj);
        this._slideWidth = (this.direction == 0) ? this.width - this._sliderImgWidth : this.height - this._sliderImgHeight;
        this._posSlideEnd = this._posSlideStart + this._slideWidth;
        this._currentRelSliderPosX = this._posSlideStart;
        if (this.valueDefault > this.minVal) {
            var hundertPercent = this.maxVal - this.minVal;
            var myPercent = (this.valueDefault - this.minVal) * 100 / hundertPercent;
            this._currentRelSliderPosX += (myPercent * this._slideWidth / 100);
        }
        if (this.direction == 0) {
            this._handleObj.style.left = this._currentRelSliderPosX+"px";
        } else {
            this._handleObj.style.top = this._currentRelSliderPosX+"px";
        }
        this._handleObj.style.display = 'block';
        temp = ech_attachMouseDrag(this._handleObj, this.slideStart, null, this.slideMove, null, this.slideEnd, null, null, null);
        temp = temp.linkCtrl(getDivImage('', 'poImg' + tagId));
        this.ctrl = temp;
        this.ctrl.sliderObj = this;
        this.ctrl.knobId = 1;
        var x = getDivLeft(this._handleObj);
        var y = getDivTop(this._handleObj);
        y = 0;
        if (this.direction == 0) {
            this.ctrl.minX = this._posSlideStart;
            this.ctrl.maxX = this._posSlideEnd;
            this.ctrl.minY = y;
            this.ctrl.maxY = y;
        } else {
            this.ctrl.minX = x;
            this.ctrl.maxX = x;
            this.ctrl.minY = this._posSlideStart;
            this.ctrl.maxY = this._posSlideEnd;
        }
        if (this.useSecondKnob) {
            this._handleObj2 = document.getElementById(this._handleId + '2');
            this._valueContainerObj2 = document.getElementById(this._valueContainerId + '2');
            this._valueFieldObj2 = document.getElementById(this._valueFieldId + '2');
            this._valueTextObj2 = document.getElementById(this._valueTextId + '2');
            this._colorbarObj2 = document.getElementById(this._colorbarId + '2');
            this._slideWidth2 = (this.direction == 0) ? this.width - this._sliderImgWidth2 : this.height - this._sliderImgHeight2;
            this._posSlideEnd2 = this._posSlideStart + this._slideWidth2;
            this._currentRelSliderPosX2 = this._posSlideStart;
            if (this.valueDefault2 > this.minVal2) {
                var hundertPercent = this.maxVal2 - this.minVal2;
                var myPercent = (this.valueDefault2 - this.minVal2) * 100 / hundertPercent;
                this._currentRelSliderPosX2 += (myPercent * this._slideWidth2 / 100);
            }
            if (this.direction == 0) {
                this._handleObj2.style.left = this._currentRelSliderPosX2+"px";
            } else {
                this._handleObj2.style.top = this._currentRelSliderPosX2+"px";
            }
            this._handleObj2.style.display = 'block';
            temp2 = ech_attachMouseDrag(this._handleObj2, this.slideStart, null, this.slideMove, null, this.slideEnd, null, null, null);
            temp2 = temp2.linkCtrl(getDivImage('', 'poImg' + tagId + '2'));
            this.ctrl2 = temp2;
            this.ctrl2.sliderObj = this;
            this.ctrl2.knobId = 2;
            var x = getDivLeft(this._handleObj2);
            var y = getDivTop(this._handleObj2);
            y = 0;
            if (this.direction == 0) {
                this.ctrl2.minX = this._posSlideStart;
                this.ctrl2.maxX = this._posSlideEnd2;
                this.ctrl2.minY = y;
                this.ctrl2.maxY = y;
            } else {
                this.ctrl2.minX = x;
                this.ctrl2.maxX = x;
                this.ctrl2.minY = this._posSlideStart;
                this.ctrl2.maxY = this._posSlideEnd2;
            }
        }
        this._updateColorbar(this._currentRelSliderPosX, 1);
        this._updateColorbar(this._currentRelSliderPosX2, 2);
    }
    this._renderInputFieldAndText = function(localOffset, knobId) {
        var k = ((typeof(knobId) == 'undefined') || (knobId == 1)) ? '' : '2';
        var out = new Array();
        var styleValueFieldClass = (this['styleValueFieldClass' + k]) ? ' class="' + this['styleValueFieldClass' + k] + '"' : '';
        var styleValueTextClass = (this['styleValueTextClass' + k])  ? ' class="' + this['styleValueTextClass' + k] + '"' : '';
        var cssAlign = (this.useSecondKnob && (knobId == 1)) ? 'align:right;' : '';
        out[out.length] = '<div id="' + this._valueContainerId + k + '" style="position:absolute; left:' + localOffset + 'px; top:0px;">';
        if (this['useInputField' + k] == 1) {
            out[out.length] = '<span' + styleValueTextClass + ' id="' + this._valueTextId + k + '">' + this['valueDefault' + k] + '</span>';
            out[out.length] = '<input type="hidden" name="' + this['fieldName' + k] + '" id="' + this._valueFieldId + k + '" value="' + this['valueDefault' + k] + '" />';
        } else if (this['useInputField' + k] == 2) {
            out[out.length] = '<input type="text"' + styleValueFieldClass + ' name="' + this['fieldName' + k] + '" id="' + this._valueFieldId + k + '" value="' + this['valueDefault' + k] + '" size="2"';
            if (styleValueFieldClass == '') {
                out[out.length] = ' style="vertical-align:text-top; width:30px; height:' + this.height + 'px;"';
            }
            out[out.length] = ' onkeyup="cObjects[' + this._id + '].onChangeByInput(this.value, false, ' + knobId + ');" onblur="cObjects[' + this._id + '].onChangeByInput(this.value, true, ' + knobId + ');" />';
        } else if (this['useInputField' + k] == 3) {
            out[out.length] = '<input type="text"' + styleValueFieldClass + ' name="' + this['fieldName' + k] + '" id="' + this._valueFieldId + k + '" value="' + this['valueDefault' + k] + '" size="2"';
            if (styleValueFieldClass == '') {
                out[out.length] = ' style="display:none; vertical-align:text-top; width:30px; height:' + this.height + 'px;"';
            } else {
                out[out.length] = ' style="display:none;"';
            }
            out[out.length] = ' onkeyup="cObjects[' + this._id + '].onChangeByInput(this.value, false, ' + knobId + ');" onblur="var _bss = cObjects[' + this._id + ']; _bss.onChangeByInput(this.value, true, ' + knobId + '); _bss.textboxEdit(false, ' + knobId + ')" />';
            out[out.length] = '<span' + styleValueTextClass + ' style="' + cssAlign + '" id="' + this._valueTextId + k + '" ';
            if (this.inputTextFieldEvent == 'click') {
                out[out.length] = 'onclick="cObjects[' + this._id + '].textboxEdit(true, ' + knobId + ');"';
            } else {
                out[out.length] = 'onmouseover="cObjects[' + this._id + '].textboxEdit(true, ' + knobId + ');"';
            }
            out[out.length] = '>' + this['valueDefault' + k] + '</span>';
        } else {
            out[out.length] = '<input type="hidden" name="' + this['fieldName' + k] + '" id="' + this._valueFieldId + k + '" value="' + this['valueDefault' + k] + '" />';
        }
        out[out.length] = '</div>';
        return out.join('');
    }
    this.drawInto = function(tagId) {
        this.render(tagId);
        if (this._disabled) this.setDisabled(true);
    }
    this.draw = function(tagId) {
        this.render(tagId);
        if (this._disabled) this.setDisabled(true);
    }
    this.attachEvent = function(trigger, yourEvent) {
        if (typeof(this._attachedEvents) == 'undefined') {
            this._attachedEvents = new Array();
        }
        if (typeof(this._attachedEvents[trigger]) == 'undefined') {
            this._attachedEvents[trigger] = new Array(yourEvent);
        } else {
            this._attachedEvents[trigger][this._attachedEvents[trigger].length] = yourEvent;
        }
    }
    this.hasEventAttached = function(trigger) {
        return (this._attachedEvents && this._attachedEvents[trigger]);
    }
    this.fireEvent = function(trigger) {
        if (this._attachedEvents && this._attachedEvents[trigger]) {
            var e = this._attachedEvents[trigger];
            if ((typeof(e) == 'string') || (typeof(e) == 'function')) {
                e = new Array(e);
            }
            for (var i = 0; i < e.length; i++) {
                if (typeof(e[i]) == 'function') {
                    e[i](this);
                } else if (typeof(e[i]) == 'string') {
                    eval(e[i]);
                }
            }
        }
    }
    this.attachOnChange = function(functionName) {
        this.eventOnChange = functionName;
    }
    this.attachOnSlideStart = function(functionName) {
        this.slideStartCB = functionName;
    }
    this.attachOnSlideMove = function(functionName) {
        this.slideMoveCB = functionName;
    }
    this.attachOnSlideEnd = function(functionName) {
        this.slideEndCB = functionName;
    }
    this.attachOnArrow = function(functionName) {
        this.eventOnArrow = functionName;
    }
    this.attachOnInputChange = function(functionName) {
        this.eventOnInputChange = functionName;
    }
    this.attachOnInputBlur = function(functionName) {
        this.eventOnInputBlur = functionName;
    }
    this.setSliderIcon = function(imgName, width, height) {
        this._sliderImgSrc = imgName;
        this._sliderImgWidth = width;
        this._sliderImgHeight = height;
    }
    this.setSliderIcon2 = function(imgName, width, height) {
        this._sliderImgSrc2 = imgName;
        this._sliderImgWidth2 = width;
        this._sliderImgHeight2 = height;
    }
    this.setArrowIconLeft = function(imgName, width, height) {
        this._arrowIconLeftSrc = imgName;
        this._arrowIconLeftWidth = width;
        this._arrowIconLeftHeight = height;
    }
    this.setArrowIconRight = function(imgName, width, height) {
        this._arrowIconRightSrc = imgName;
        this._arrowIconRightWidth = width;
        this._arrowIconRightHeight = height;
    }
    this.setBackgroundImage = function(src, repeat, cssStyle) {
        this._bgImgSrc = src;
        this._bgImgRepeat = repeat;
        this._bgImgCssStyle = cssStyle;
    }
    this.setBackgroundImageLeft = function(imgName, width, height) {
        this._bgImgLeftSrc = imgName;
        this._bgImgLeftWidth = width;
        this._bgImgLeftHeight = height;
    }
    this.setBackgroundImageRight = function(imgName, width, height) {
        this._bgImgRightSrc = imgName;
        this._bgImgRightWidth = width;
        this._bgImgRightHeight = height;
    }
    this.setDisplay = function(display) {
        this._display = display;
        if (this._containerObj) {
            switch (display) {
                case 0:
                    this._containerObj.style.display = 'none';break;case 1:
                this._containerObj.style.visibility = 'hidden';break;case 2:
                this._containerObj.style.visibility = 'visible';this._containerObj.style.display = 'block';break;default:
            }
        }
    }
    this.setDisabled = function(b) {
        if (typeof(b) == 'undefined') b = !this._disabled;
        if (b) {
            var filter = 'progid:DXImageTransform.Microsoft.BasicImage(grayScale=1); progid:DXImageTransform.Microsoft.BasicImage(opacity=.5)';
            var cursor = 'default';
        } else {
            var filter = null;
            var cursor = 'hand';
        }
        var t = new Array(
                this._containerId, this._arrowLeftContainerId, this._arrowRightContainerId,
                this._valueFieldId, this._valueTextId,
                this._slideBarId, this._colorbarId, this._handleId,
                this._valueFieldId + '2',
                this._valueTextId + '2',
                this._colorbarId + '2',
                this._handleId + '2'
                );
        for (var i = 0; i < t.length; i++) {
            var elm = document.getElementById(t[i]);
            if (elm != null) {
                if( (navigator.userAgent.indexOf('MSIE')!=-1)) {
                    elm.style.filter = filter;
                } else {
                    if(b) {this.hideHandle(); } else {this.showHandle();}
                }
            }
        }
        var elm = document.getElementById(this._arrowLeftIconId);
        if (elm != null) elm.style.cursor = cursor;
        var elm = document.getElementById(this._arrowRightIconId);
        if (elm != null) elm.style.cursor = cursor;
        var elm = document.getElementById(this._valueFieldId);
        if (elm != null) elm.disabled = b;
        this._disabled = b;
    }
    this.getValue = function(knobId) {
        if ((typeof(knobId) == 'undefined') || (knobId == 1)) {
            return this._valueInternal;
        } else {
            return this._valueInternal2;
        }
    }
    this.getValueInPercent = function(knobId) {
        if ((typeof(knobId) == 'undefined') || (knobId == 1)) {
            var range = Math.abs(this.maxVal - this.minVal);
            var percent = Math.abs(this._valueInternal - this.minVal) / range * 100;
            return percent;
        } else {
            var range = Math.abs(this.maxVal2 - this.minVal2);
            var percent = Math.abs(this._valueInternal2 - this.minVal2) / range * 100;
            return percent;
        }
    }
    this.getSliderPos = function(knobId) {
        if (typeof(knobId) == 'undefined') knobId = 1;
        if (knobId == 1) {
            var absLeng = (this.direction == 0) ? getDivLeft(this.ctrl.div) - this.ctrl.minX : getDivTop(this.ctrl.div) - this.ctrl.minY;
            var absRang = this.maxVal - this.minVal;
            return (absLeng * absRang / this._slideWidth) + this.minVal;
        } else {
            var absLeng = (this.direction == 0) ? getDivLeft(this.ctrl2.div) - this.ctrl2.minX : getDivTop(this.ctrl2.div) - this.ctrl2.minY;
            var absRang = this.maxVal2 - this.minVal2;
            return (absLeng * absRang / this._slideWidth2) + this.minVal2;
        }
    }
    this.onChangeBySlide = function(ctrl) {
        if (this._disabled) return;
        var newPos = this._getNewLocationFromCursor(ctrl);
        var val = this._getValueByPosition(newPos);
        val = this._roundToGrid(val, ctrl.knobId);
				
				newPos = this._getPositionByValue(val);//++++++

        var valInternal = (ctrl.knobId == 1) ? this._valueInternal : this._valueInternal2;
        if (val != valInternal) {
            if (ctrl.knobId == 1) {
                this._valueInternal = val;
            } else {
                this._valueInternal2 = val;
            }
            this.updateHandle(newPos, ctrl.knobId);
            this.updateValueField(val, ctrl.knobId);
            this.updateValueText(val, ctrl.knobId);
            this._updateColorbar(newPos, ctrl.knobId);
            if ('undefined' != typeof(this.eventOnChange)) {
                if (this.useSecondKnob) {
                    this.eventOnChange(this, val, newPos, ctrl.knobId);
                } else {
                    this.eventOnChange(this, val, newPos);
                }
            }
            this.fireEvent('onChange');
        }
    }
    this.onChangeByClick = function(event) {
        if (this._disabled) return;
        var newPos = 0;
        if ('undefined' != typeof(event.offsetX)) {
            newPos = (this.direction == 0) ? event.offsetX + this._posSlideStart : event.offsetY + this._posSlideStart;
        } else if ('undefined' != typeof(event.layerX)) {
           
            newPos = (this.direction == 0) ? event.layerX + this._posSlideStart  : event.layerY + this._posSlideStart;
        } else {
            return;
        }
        
        var val = this._getValueByPosition(newPos);
        var eID = (navigator.userAgent.indexOf('MSIE')!=-1)? event.srcElement.id : event.target.id;
        
        if (this.useSecondKnob) {
            if(eID==this._colorbarObj2.id) {
             val=val+this._valueInternal2;
             newPos = this._getPositionByValue(val);
            }
            if (val > this._valueInternal2) {
                var knobId = 2;
            } else if (val < this._valueInternal) {
                var knobId = 1;
            } else {
                return;
            }
        } else {
            var knobId = 1;
        }
        
        if(this.useSecondKnob){
         if(eID==this._colorbarObj2.id || knobId==2) {
           val = this._roundToGrid(val,2);
         } else {
            val = this._roundToGrid(val);
           }
        } else { val = this._roundToGrid(val); }
        
        if (val != this._valueInternal) {
            if (knobId == 1) {
                this._valueInternal = val;
            } else {
                this._valueInternal2 = val;
            }
            this.updateHandle(newPos, knobId);
            this.updateValueField(val, knobId);
            this.updateValueText(val, knobId);
            this._updateColorbar(newPos, knobId);
            if ('undefined' != typeof(this.eventOnChange)) {
                if (this.useSecondKnob) {
                    this.eventOnChange(this, val, newPos, knobId);
                } else {
                    this.eventOnChange(this, val, newPos);
                }
            }
            this.fireEvent('onChange');
        }
        if(this.slideEndCB) this.slideEndCB();
    }
    this.onChangeByInput = function(val, isBlur, knobId) {
        var k = ((typeof(knobId) == 'undefined') || (knobId == 1)) ? '' : '2';
        if (this._disabled) return;
        if (val == '') {
            val = this['minVal' + k];
        }
        val = this._roundToGrid(val, knobId);
        var newPos = this._getPositionByValue(val);
        if (val != this['_valueInternal' + k]) {
            this['_valueInternal' + k] = val;
            this.updateHandle(newPos, knobId);
            this._updateColorbar(newPos, knobId);
            if ('undefined' != typeof(this.eventOnChange)) {
                if (this.useSecondKnob) {
                    this.eventOnChange(this, val, newPos, knobId);
                } else {
                    this.eventOnChange(this, val, newPos);
                }
            }
            this.fireEvent('onChange');
            if (isBlur) {
                this.updateValueField(val, knobId);
                this.updateValueText(val, knobId);
            }
        } else if (isBlur) {
            this.updateValueField(val, knobId);
            this.updateValueText(val, knobId);
        }
    }
    this.onChangeByArrow = function(leftOrRight, keepFiring, loopCall) {
        if (!loopCall) this._stopFireArrowFlag = false;
        if (this._stopFireArrowFlag) return;
        if (this._disabled) return;
        var val = parseFloat(this._valueInternal);
        if (leftOrRight) {
            val += this.arrowAmount;
        } else {
            val -= this.arrowAmount;
        }
        val = this._roundToGrid(val);
        if (val != this._valueInternal) {
            this._valueInternal = val;
            var newPos = this._getPositionByValue(val);
            this.updateHandle(newPos);
            this.updateValueField(val);
            this.updateValueText(val);
            this._updateColorbar(newPos);
            if ('undefined' != typeof(this.eventOnChange)) {
                if (this.useSecondKnob) {
                    this.eventOnChange(this, val, newPos, 1);
                } else {
                    this.eventOnChange(this, val, newPos);
                }
            }
            this.fireEvent('onChange');
        }
        if (keepFiring) {
            if (!this._stopFireArrowFlag && (this.arrowKeepFiringTimeout > 0)) {
                setTimeout('cObjects[' + this._id + '].onChangeByArrow(' + leftOrRight + ', ' + keepFiring + ', true);', this.arrowKeepFiringTimeout);
            }
        }
    }
    this.onMouseWheel = function() {
        if (this._disabled) return;
        var val = parseFloat(this._valueInternal);
        if (event.wheelDelta > 0) {
            val -= this.wheelAmount;
        } else {
            val += this.wheelAmount;
        }
        val = this._roundToGrid(val);
        if (val != this._valueInternal) {
            this._valueInternal = val;
            var newPos = this._getPositionByValue(val);
            this.updateHandle(newPos);
            this.updateValueField(val);
            this.updateValueText(val);
            this._updateColorbar(newPos);
            if ('undefined' != typeof(this.eventOnChange)) {
                if (this.useSecondKnob) {
                    this.eventOnChange(this, val, newPos, 1);
                } else {
                    this.eventOnChange(this, val, newPos);
                }
            }
            this.fireEvent('onChange');
        }
    }
    this.stopFireArrow = function() {
        this._stopFireArrowFlag = true;
    }
    this.setValue = function(val, knobId) {
        if (typeof(knobId) == 'undefined') knobId = 1;
        val = this._roundToGrid(val, knobId);
        var newPos = this._getPositionByValue(val);
        var valInternal = (knobId == 1) ? this._valueInternal : this._valueInternal2;
        if (val != valInternal) {
            if (knobId == 1) {
                this._valueInternal = val;
            } else {
                this._valueInternal2 = val;
            }
            this.updateHandle(newPos, knobId);
            this._updateColorbar(newPos, knobId);
            if ('undefined' != typeof(this.eventOnChange)) {
                if (this.useSecondKnob) {
                    this.eventOnChange(this, val, newPos, knobId);
                } else {
                    this.eventOnChange(this, val, newPos);
                }
            }
            this.fireEvent('onChange');
            this.updateValueField(val, knobId);
            this.updateValueText(val, knobId);
        }
    }
    this.onChangeByApi = function(val, knobId) {
        this.setValue(val, knobId);
    }
    this._updateColorbar = function(newPos, knobId) {
        var k = ((typeof(knobId) == 'undefined') || (knobId == 1) || ((typeof(this.colorbar) != 'undefined') && ((typeof(this.colorbar.type) != 'undefined') || (this.colorbar.type == 'between')))) ? '' : '2';
        if (this['_colorbarObj' + k]) {
            if ((typeof(this.colorbar.type) != 'undefined') && (this.colorbar.type == 'between')) {
                var left = this._getPositionByValue(this._valueInternal, 1);
                var right = this._getPositionByValue(this._valueInternal2, 2);
                this['_colorbarObj' + k].style.left = (left + this.colorbar.offsetLeft)+"px";
                this['_colorbarObj' + k].style.width = (right - left)+"px";
            } else {
                var newWidth = newPos + this['colorbar' + k]['widthDifference'];
                if (newWidth < 0) newWidth = 0;
                if (k == '2') {
                    var invertedWidth = this.width - newWidth;
                    if (invertedWidth < 0) invertedWidth = 0;
                    this['_colorbarObj' + k].style.width = (Math.ceil(invertedWidth))+"px";
                    if (typeof(this.colorbar2['offsetLeft']) != 'undefined') newWidth += this.colorbar2['offsetLeft'];
                    this['_colorbarObj' + k].style.left = newWidth+"px";
                } else {
                    this['_colorbarObj' + k].style.width = newWidth+"px";
                }
            }
            if (typeof(this['colorbar' + k]['color2']) != 'undefined') {
                var percent = this.getValueInPercent(knobId);
                var newColor = mixColor(this['colorbar' + k]['color'], this['colorbar' + k]['color2'], percent);
                document.getElementById(this._colorbarId + k).style.backgroundColor = newColor;
            }
        }
    }
    this._getValueByPosition = function(pos) {
        if (this.direction == 0) {
            pos -= this.ctrl.minX;
            var hundertPercent = this.ctrl.maxX - this.ctrl.minX;
        } else {
            pos -= this.ctrl.minY;
            var hundertPercent = this.ctrl.maxY - this.ctrl.minY;
        }
        var myPercent = pos / hundertPercent;
        var val = this.minVal + ((this.maxVal - this.minVal) * myPercent);
        return val;
    }
    this._getPositionByValue = function(val, knobId) {
        var k = ((typeof(knobId) == 'undefined') || (knobId == 1)) ? '' : '2';
        val = val - this['minVal' + k];
        var hundertPercent = this['maxVal' + k] - this['minVal' + k];
        var myPercent = val / hundertPercent;
        if (this.direction == 0) {
            var pos = this['ctrl' + k].minX + ((this['ctrl' + k].maxX - this['ctrl' + k].minX) * myPercent);
        } else {
            var pos = this['ctrl' + k].minY + ((this['ctrl' + k].maxY - this['ctrl' + k].minY) * myPercent);
        }
        return pos;
    }
    this._roundToGrid = function(val, knobId) {
        val = parseFloat(val);
        if (isNaN(val)) return this.minVal;
				//val = Math.round(val * 10000) / 10000;
        val = Math.round(val / this.increment) * this.increment;
        if (val < this.minVal) val = this.minVal;
        //        if (val > this.maxVal) val = this.maxVal;
				
        if (this.useSecondKnob && this.preventValueCrossing) {
            if ((typeof(knobId) == 'undefined') || (knobId == 1)) {
                if (val >= this._valueInternal2) {
                    val = this._valueInternal2 - this.increment;
                    if (val < this.minVal) val = this.minVal;
                }
            } else {
                if (val <= this._valueInternal) {
                    val = this._valueInternal + this.increment2;
                    if (val > this.maxVal2) val = this.maxVal2;
                }
            }
        }
        return val;
    }
    this._getNewLocationFromCursor = function(ctrl) {
        if (ctrl.knobId == 1) {
            var ox = this._posEventSlideStartX;
            var oy = this._posEventSlideStartY;
            var posObjSlideStartX = this._posObjSlideStartX;
            var posObjSlideStartY = this._posObjSlideStartY;
        } else {
            var ox = this._posEventSlideStartX2;
            var oy = this._posEventSlideStartY2;
            var posObjSlideStartX = this._posObjSlideStartX2;
            var posObjSlideStartY = this._posObjSlideStartY2;
        }
        switch (this.direction) {
            case 0:
                var t = ctrl.pageX - ox;var x = parseInt(posObjSlideStartX) + t;if (x > ctrl.maxX) x = ctrl.maxX;if (x < ctrl.minX) x = ctrl.minX;return x;
						case 1:
                var t = ctrl.pageY - oy;var y = parseInt(posObjSlideStartY) + t;if (y > ctrl.maxY) y = ctrl.maxY;if (y < ctrl.minY) y = ctrl.minY;return y;}
    }
    this.updatePointer = function(newPos) {
        this.updateHandle(newPos);
    }
    this.hideHandle = function() {
        this.ctrl.div.style.display = 'none';
        return;
    }
    this.showHandle = function() {
        this.ctrl.div.style.display = 'inline';
        return;
    }
    this.updateHandle = function(newPos, knobId) {
        if ((typeof(knobId) == 'undefined') || (knobId == 1)) {
            if (knobId == 1) { this.ctrl.div.style.zIndex=this.baseZindex + 10; }
            if (this.direction == 0) {
                this._currentRelSliderPosX = newPos;
                this.ctrl.div.style.left = newPos+"px";
            } else {
                this._currentRelSliderPosX = newPos;
                this.ctrl.div.style.top = newPos+"px";
            }
        } else {
            if (knobId == 2){ this.ctrl.div.style.zIndex=this.baseZindex + 8; }
            if (this.direction == 0) {
                this._currentRelSliderPosX2 = newPos;
                this.ctrl2.div.style.left = newPos+"px";
            } else {
                this._currentRelSliderPosX2 = newPos;
                this.ctrl2.div.style.top = newPos+"px";
            }
        }
        return;
    }
    this.updateValueField = function(val, knobId) {
        var k = ((typeof(knobId) == 'undefined') || (knobId == 1)) ? '' : '2';
        if (this['_valueFieldObj' + k]) {
            this['_valueFieldObj' + k].value = val;
        }
    }
    this.updateValueText = function(val, knobId) {
        var k = ((typeof(knobId) == 'undefined') || (knobId == 1)) ? '' : '2';
        if (this['_valueTextObj' + k]) {
            this['_valueTextObj' + k].innerHTML = val;
        }
    }
    this.arrowOnClick = function() {
    }
    this.onChange = function(val) {
        if (this._disabled) return;
        this.setValue(val);
    }
    this.updateInputBox = function(val) {
        if (this._disabled) return;
        this.setValue(val);
    }
    this.textboxEdit = function(editMode, knobId) {
        var k = ((typeof(knobId) == 'undefined') || (knobId == 1)) ? '' : '2';
        if (this._disabled) return;
        if (editMode) {
            if ('undefined' != typeof(this['_valueFieldObj' + k])) {
                this['_valueTextObj' + k].style.display = 'none';
                this['_valueFieldObj' + k].style.display = 'block';
            }
        } else {
            if ('undefined' != typeof(this['_valueTextObj' + k])) {
                this['_valueFieldObj' + k].style.display = 'none';
                this['_valueTextObj' + k].style.display = 'block';
            }
        }
    }
    this.slideMove = function(ctrl, client) {
        ctrl.sliderObj.onChangeBySlide(ctrl);
    }
    this.slideStart = function(ctrl, client) {
        if (ctrl.knobId == 1) {
            //ctrl.sliderObj._handleObj.style.zIndex += 2;
            ctrl.sliderObj._posEventSlideStartX = ctrl.startX;
            ctrl.sliderObj._posEventSlideStartY = ctrl.startY;
            ctrl.sliderObj._posObjSlideStartX = ctrl.sliderObj._handleObj.style.left+"px";
            ctrl.sliderObj._posObjSlideStartY = ctrl.sliderObj._handleObj.style.top+"px";
        } else {
            //ctrl.sliderObj._handleObj2.style.zIndex += 2;
            ctrl.sliderObj._posEventSlideStartX2 = ctrl.startX;
            ctrl.sliderObj._posEventSlideStartY2 = ctrl.startY;
            ctrl.sliderObj._posObjSlideStartX2 = ctrl.sliderObj._handleObj2.style.left+"px";
            ctrl.sliderObj._posObjSlideStartY2 = ctrl.sliderObj._handleObj2.style.top+"px";
        }
        var pos = ctrl.sliderObj.getSliderPos(ctrl.knobId);
        ctrl.sliderObj.setValue(pos, ctrl.knobId);
        if ('undefined' != typeof(ctrl.sliderObj.slideStartCB)) {
            ctrl.sliderObj.slideStartCB(ctrl.sliderObj, ctrl.sliderObj.getValue(), pos);
        }
    }
    this.slideEnd = function(ctrl, client) {
        if (this._disabled) return;
        if (ctrl.knobId == 1) {
            //ctrl.sliderObj._handleObj.style.zIndex -= 2;
        } else {
            //ctrl.sliderObj._handleObj2.style.zIndex -= 2;
        }
        var pos = ctrl.sliderObj.getSliderPos();
        if ('undefined' != typeof(ctrl.sliderObj.slideEndCB)) {
            ctrl.sliderObj.slideEndCB(ctrl.sliderObj, ctrl.sliderObj.getValue(), pos);
        }
        return;
    }
    this._constructor(theFieldnamePrefix);
}
