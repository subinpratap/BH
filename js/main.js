function matchLunchEvent(events) {
  utitlityFnObj.calcOverlap(events);
}

var utitlityFnObj = {};

$(document).ready(function () {

    utitlityFnObj.calcOverlap = function(events) {
      $(".meeting-event").remove();
      var nikki = events[0];
      nikki.id = 101;
      var others = events.slice(1);

      others.sort(compare);

      var maxOverlapTime = 0;
      var firstArrivalTime = 1000;
      var multipleFirstArrivals = 0;
      var shortListedPersonArray = [];
      var arrayToRender = [];
      globalVar.finalPersonToMeetId = 0;


      others.forEach((ele, index) => {
        ele.id = index+1;
        if(inBetween(ele.start, ele.end, nikki.start) || inBetween(ele.start, ele.end, nikki.end)) {
          ele.overlapFlag = 'T';//Not used in coding, for visual reference in logs
          ele.overlapTime = calcOverlapTime(ele.start, ele.end, nikki.start, nikki.end);

          if(ele.overlapTime > 30) {
            if(maxOverlapTime < ele.overlapTime) {
              shortListedPersonArray = [];//Emptying the array if a person is found with more overlapping time than the previous one as we are concerned with getting the perosn with max overlap time
              firstArrivalTime = 1000;
              shortListedPersonArray.push(ele);
              if(firstArrivalTime > ele.start) {
                firstArrivalTime = ele.start;
              }
              maxOverlapTime = ele.overlapTime;
            } else if(maxOverlapTime == ele.overlapTime) {
              if(firstArrivalTime > ele.start) {
                firstArrivalTime = ele.start;
              }
              shortListedPersonArray.push(ele); // pushing in the array as both are having max and equal overlapping times
            }
          }
        }
      });

      shortListedPersonArray.forEach((ele)=> {
        if(ele.start == firstArrivalTime) {
          ele.priority = '1';
          globalVar.finalPersonToMeetId = ele.id; // setting the finalPerson's ID which will meet nikki
          multipleFirstArrivals++; // in case multiple persons arrive at same time having same overlap time as well 
        }
      });

      if(multipleFirstArrivals > 1) { // setting ID randomly in case of mutiple first arrivals having same overlap time with nikki
        globalVar.finalPersonToMeetId = shortListedPersonArray[Math.floor(Math.random()*shortListedPersonArray.length)].id;
      }

      console.log("final ID " + globalVar.finalPersonToMeetId);
      arrayToRender = createEventRenderArray(others.concat(nikki)); //final array which will be painted on screen
      console.log(arrayToRender);

      paintRenderArray(arrayToRender);
    }

    function createEventRenderArray(eventArr) { // Constructing the final array which will be painted on screen
      eventArr.sort(compare);
      eventArr = checkCollision(eventArr);
      
      var arr=eventArr.slice(0); //clone the array
      for(var i=0; i<arr.length; i++){
        var el=arr[i];
        el.height = (el.end - el.start)+ 'px';
        el.top = (el.start) + 'px';
        
        if(i>0 && el.colsBefore.length>0){ //check column if not the first event and the event has collisions with prior events
          if(arr[i-1].column>0){ //if previous event wasn't in the first column, there may be space to the left of it
            for(var j=0;j<arr[i-1].column;j++){ //look through all the columns to the left of the previous event
              if(el.colsBefore.indexOf(i-(j+2))===-1){ //the current event doesn't collide with the event being checked...
                el.column=arr[i-(j+2)].column; //...and can be put in the same column as it
              }
            }
            if(typeof el.column==='undefined') el.column=arr[i-1].column+1; //if there wasn't any free space, but it ito the right of the previous event
          }else{
            var column=0;
            for(var j=0;j<el.colsBefore.length;j++){ //go through each column to see where's space...
              if(arr[el.colsBefore[el.colsBefore.length-1-j]].column==column) column++;
            }
            el.column=column;
          }
        } else el.column=0;// if no columns present before itself means it has to be inserted at position 0
      }
      //We need the column for every event before we can determine the appropriate width and left-position, so this is in a different for-loop:
      for(let i=0; i<arr.length; i++){
        arr[i].totalColumns=0;
        if(arr[i].cols.length>1) { //if event collides
          var conflictGroup=[]; //store here each column in the current event group
          var conflictingColumns=[]; //and here the column of each of the events in the group
          addConflictsToGroup(arr[i]);

          function addConflictsToGroup(a) {
            for(let k=0;k<a.cols.length;k++){
              if(conflictGroup.indexOf(a.cols[k])===-1) { //don't add same event twice to avoid infinite loop
                conflictGroup.push(a.cols[k]);
                conflictingColumns.push(arr[a.cols[k]].column);
                addConflictsToGroup(arr[a.cols[k]]); //check also the events this event conflicts with
              }
            }            
          }
          arr[i].totalColumns=Math.max.apply(null, conflictingColumns); //set the greatest value as number of columns
        }
        arr[i].width=(600/(arr[i].totalColumns+1))+'px';
        arr[i].left=((600/(arr[i].totalColumns+1)*arr[i].column)+10)+'px';
      }
      return arr;
    }

    function checkCollision(eventArr) {
      for (let i = 0; i < eventArr.length; i++) {
        eventArr[i].cols = [];
        eventArr[i].colsBefore=[];
        for (let j = 0; j < eventArr.length; j++) {
          if (collidesWith(eventArr[i], eventArr[j])) {
            eventArr[i].cols.push(j); // pushing column number if meeting timings coincide with each other
            if(i>j) eventArr[i].colsBefore.push(j); // pushing column number(which is before the current column) if meeting timings coincide with each other 
          }
        }
      }
      return eventArr;
    }

    function inBetween(minRange, maxRange, num) {
      return num >= minRange && num <= maxRange;
    }

    function compare(a,b) { // for sorting the array as per arrival time
      if (a.start < b.start)
        return -1;
      if (a.start > b.start)
        return 1;
      return 0;
    }

    function calcOverlapTime(in1, out1, in2, out2) { //calculate overlap time with nikki
      let minTime = Math.min(...arguments);
      let maxTime = Math.max(...arguments);
      return Math.abs((Math.abs(minTime-maxTime))-(Math.abs(in1-out1) + Math.abs(in2-out2)));
    }

    function paintRenderArray(arr) {
      let finalArray = arr;
      finalArray.forEach((ele, i)=>{
        var eventEl = document.createElement('div');
        eventEl.id = ele.id;
        eventEl.className = 'meeting-event';
        eventEl.style.width = ele.width;
        eventEl.style.left = ele.left;        
        eventEl.style.height = ele.height;
        eventEl.style.top = ele.top;
        if(ele.id == 101) {
          eventEl.innerHTML = 'Me';
          if(globalVar.finalPersonToMeetId > 0) {
            eventEl.style.color = '#2D8730';
            eventEl.style['border-left'] = '5px solid #2D8730';
          } else {
            eventEl.style.color = '#3B3F3B';
            eventEl.style['border-left'] = '5px solid #3B3F3B';
          }
        } else {
          eventEl.innerHTML = 'Brilliant Lunch';
        }
        if(globalVar.finalPersonToMeetId == ele.id) {
          eventEl.style.color = '#2D8730';
          eventEl.style['border-left'] = '5px solid #2D8730';
        }
        $('#meeting-container').append(eventEl);
      });   
    }
    
    function collidesWith(a, b) {
      return a.end > b.start && a.start < b.end; // returns true if two meetings overlap or coincide
    }  

    function convertTime(s) {
      let hours = Math.floor(s/60);
      let minutes = s % 60;
      let ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0'+minutes : minutes;
      let strTime = hours + ':' + minutes;
      let id =  hours + minutes
      return [strTime, ampm, id];
    }

    function paintTimeline() {
      for(let i=0; i < 25; i++) {
          let totalMins = 540 + (i*30);
          timeArr = convertTime(totalMins);
          var div = '<div class="time-wrapper"><p class="time">' + timeArr[0] + '<span class="ampm">'+ timeArr[1] +'</span>' + '</p></div>'
          $('#timeline').append(div);
        }
    }
    
    //To be used in global scope
    (function() {
      globalVar = {
        finalPersonToMeetId : 0,
        baseLunchEventsArr : [{start: 225, end: 285},{start: 210,
          end: 270},{start: 180, end: 240},{start: 240, end:
          300},{start: 300, end: 360},{start: 270, end: 330}]
      }
    })();

    paintTimeline();// Paint the timeline on left side of screen

    matchLunchEvent(globalVar.baseLunchEventsArr);
});

