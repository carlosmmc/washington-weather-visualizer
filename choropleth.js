        // set dates
        n =  new Date();
        y = n.getFullYear();
        m = String(n.getMonth() + 1).padStart(2,'0');
        sd = n.getDate();
        ed = sd + 8;

        document.getElementById("date_cal_select").min = y + '-' + m + '-' + sd
        document.getElementById("date_cal_select").max = y + '-' + m + '-' + ed
        document.getElementById("date_cal_select").value = y + '-' + m + '-' + sd

        var height = 550;
        var width = 800;

        //projection and path of map
        var projection = d3.geoMercator()
                           .center([-120.574951, 47.361153])
                           .scale(5000)
                           .translate([(width) * .51, (height)*.44]);

        var path = d3.geoPath()
                        .projection(projection);

        Promise.all([
            d3.json("data/map.geojson"),
            d3.csv("data/daily_weather.csv"),
            d3.csv("data/wa-zip-code.csv")
        ]).then(function(values){
            var fixed = values[0].features.map(function(f) {
			    return turf.rewind(f,{reverse:true});
		    })
            ready(null, fixed, values[1],values[2])
            }
        );

        function ready(error, wa_geo, weather_data, lat_long) {
            function refreshGraphics() {
                var data_selected = document.getElementById("data_select").value
                var month_selected = String(Number(document.getElementById("date_cal_select").value.split("-")[1]))
                var date_selected = String(Number(document.getElementById("date_cal_select").value.split("-")[2]))
                createMapAndLegend(wa_geo,weather_data,data_selected,month_selected,date_selected,lat_long)
            }

            refreshGraphics()
            document.getElementById("date_cal_select").onchange = refreshGraphics;
            document.getElementById("data_select").onchange = refreshGraphics;
        }

        function makeToolTip(svg, zip, pop, feels, cloud, wind, lat, long, icon, cond_desc){
            // body of tooltip
            svg.append('rect')
               .attr('x', 5)
               .attr('y', 25)
               .attr('width', 280)
               .attr('height', 310)
               .attr('rx', 50)
               .attr("id","container_card");

            // zip code header
            svg.append("text")
               .attr("y", 70)
               .attr("x", 145)
               .text('Zip Code: ' + zip)
               .attr("text-anchor", "middle")
               .attr("class", "tool_text tip_header")

            // icon
            svg.append("svg:image")
               .attr('x', 78)
               .attr('y', 53)
               .attr('width', 120)
               .attr('height', 120)
               .attr("xlink:href", 'http://openweathermap.org/img/wn/'+icon+'@2x.png')

            console.log(cond_desc)
            svg.append("text")
               .attr("y", 165)
               .attr("x", 138)
               .text(cond_desc)
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_desc")

            // precip
            svg.append("text")
               .attr("y", 225)
               .attr("x", 70)
               .text('Chance of')
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_desc")

            svg.append("text")
               .attr("y", 245)
               .attr("x", 70)
               .text('Precipitation')
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_desc")

            svg.append("text")
               .attr("y", 205)
               .attr("x", 70)
               .text(pop)
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_info")

            // feels like
            svg.append("text")
               .attr("y", 225)
               .attr("x", 210)
               .text('Feels Like')
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_desc")

            svg.append("text")
               .attr("y", 205)
               .attr("x", 210)
               .text(feels)
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_info")

            // cloud cover
            svg.append("text")
               .attr("y", 310)
               .attr("x", 70)
               .text('Cloud Cover')
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_desc")

            svg.append("text")
               .attr("y", 290)
               .attr("x", 70)
               .text(cloud)
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_info")

            // wind
            svg.append("text")
               .attr("y", 310)
               .attr("x", 210)
               .text('Wind Speeds')
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_desc")

            svg.append("text")
               .attr("y", 290)
               .attr("x", 210)
               .text(wind)
               .attr("text-anchor", "middle")
               .attr("class", "tool_text cat_info")

            // link bar
            svg.append("svg:image")
               .attr('x', 90)
               .attr('y', 340)
               .attr('width', 45)
               .attr('height', 45)
               .attr("href", "images/Google Maps.png")
               .on("click", function() {
                    window.open('https://maps.google.com/?q='+lat+','+long+'&ll='+lat+','+long+'&z=8')                                                    
                             .focus();
                    })
                .style("cursor", "pointer");

            svg.append("text")
                .attr("y",395)
                .attr("x", 112)
                .text("Google")
                .attr("text-anchor", "middle")
                .attr("class", "link_text")

            svg.append("text")
                .attr("y",410)
                .attr("x", 112)
                .text("Maps")
                .attr("text-anchor", "middle")
                .attr("class", "link_text")

            svg.append("svg:image")
               .attr('x', 165)
               .attr('y', 345)
               .attr('width', 35)
               .attr('height', 35)
               .attr("href", "images/All Trails.png")
               .on("click", function() {
                    alert('The map will be very zoomed in, scroll out to see nearby trails.')
                    window.open('https://www.alltrails.com/explore?b_tl_lat='+lat+'&b_tl_lng='+long+'&b_br_lat='+lat+'&b_br_lng='+long)
                            .focus();
                    })
                .style("cursor", "pointer");

            svg.append("text")
                .attr("y",396)
                .attr("x", 182)
                .text("All")
                .attr("text-anchor", "middle")
                .attr("class", "link_text")

            svg.append("text")
                .attr("y",411)
                .attr("x", 182)
                .text("Trails")
                .attr("text-anchor", "middle")
                .attr("class", "link_text")
        }

        function createMapAndLegend(wa_geo, weather_data, data_selected, month, day,lat_long) {
            var selected = -1

            d3.select("#choropleth")
                .selectAll("*")
                .remove();

            // append new svg
            var svg = d3.select("#choropleth")
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .append("g");

            var color_range={'wind_speed':["#E3E3E3","#3F007D"],
                             'clouds':["#f9d71c","#BEBEBE"],
                             'average_feel':['#0096c7','#ededed','#e5383b'],
                             'pop':['#E5E5E5','#0096c7']}

            var color_domain=[0,100]
            
            if (data_selected==='average_feel') {
                // calculate [low, median, high] to give color range balance
                var low_high=d3.extent(weather_data, function(d){
                                    if (d.month===month && d.day===day){
                                        return +d[data_selected];
                                    }})
                var mid=d3.median(weather_data, function(d){
                                    if (d.month===month && d.day===day){
                                        return +d[data_selected];
                                    }})
                
                color_domain=[low_high[0], mid, low_high[1]]
            } else if (data_selected==='wind_speed') {
                color_domain=[0,d3.max(weather_data, function(d){
                                    if (d.month===month && d.day===day){
                                        return +d[data_selected];
                                    }})]
            }

            var color = d3.scaleLinear()
                          .domain(color_domain)
                          .range(color_range[data_selected])                

            // create legend
            svg.append("g")
                .attr("class", "legendLinear")
                .attr("transform", "translate("+width*.25+","+height*.92+")");

            var legend = d3.legendColor()
                            .labelFormat(d3.format(".0f"))
                            .orient('horizontal')
                            .cells(10)
                            .shapeWidth(40)
                            .shapePadding(.5)
                            .scale(color);

            svg.select(".legendLinear")
                .call(legend);

            var proper_titles={'average_feel':'Feels Like (Temperature - F)',
                                'clouds':'Cloud Cover (%)',
                                'wind_speed':'Wind Speeds (mph)',
                                'pop':'Chance of Precipitation (%)'}

            svg.append('text')
                .attr('transform', 'translate(' + (width*.5) + ', ' + (height*.9) + ')')
                .text(proper_titles[document.getElementById("data_select").value])
                .style('font-size', '16px')
                .style('text-anchor','middle')
                .style('font-weight',1000)
                .attr('class','legendLinear')

            var svg_tip = d3.select("#choropleth")
                                    .append("svg")
                                    .attr("width", 290)
                                    .attr("height", 450)
                                    .attr("transform", "translate(-25,-70)")
                                    .append("g");
            
            // draw map and color
            svg.selectAll("path")
                .data(wa_geo)
                .enter()
                .append("path")
                .attr("d", path)
                .style("cursor", "pointer")
                .attr('id', function(d){
                    var weather_record = weather_data.filter(function(indiv){
                        return (indiv.zip_code===d.id && indiv.month===month && indiv.day===day)
                    })

                    const point_value = weather_record[0][data_selected]
                    return color(+point_value)
                })
                .style('fill', function(d){
                    return d3.select(this).attr('id')
                })
                .style('stroke', function(d){
                    return d3.select(this).attr('id')
                })
                .on('mouseover', function(d) {
                    if (selected == -1){
                        d3.select(this)
                          .style("fill", "black")
                          .style("stroke", "black")

                        // records for tool tip
                        var req_weather = weather_data.filter(function(indiv){
                            return (indiv.zip_code===d.id && indiv.month===month && indiv.day===day)
                        })

                        var req_coords = lat_long.filter(function(indiv){
                            return (indiv.Zip===d.id)
                        })
                        
                        // values for tool tip
                        if (d.id.includes('Unzipped')){
                            var zip = 'N/A';
                        }
                        else {
                            var zip = d.id;
                        }
                        var pop = Math.round(req_weather[0]['pop']) + '%';
                        var feels = parseFloat(req_weather[0]['average_feel']).toFixed(0)+'° F';
                        var cloud = parseFloat(req_weather[0]['clouds'])+'%';
                        var wind = parseFloat(req_weather[0]['wind_speed']).toFixed(0)+' mph';
                        var lat = req_coords[0]['Latitude'];
                        var long = req_coords[0]['Longitude'];
                        var icon = req_weather[0]['condition_icon'];
                        var cond_desc = req_weather[0]['condition_description'];
                                                
                        makeToolTip(svg_tip, zip, pop, feels, cloud, wind, lat, long, icon, cond_desc)
                    }})
            .on('mouseout', function(d){
                if (selected == -1){
                    d3.select(this)
                        .style('fill', function(d){
                            return d3.select(this).attr('id')
                        })
                        .style('stroke', function(d){
                            return d3.select(this).attr('id')
                        })

                    svg_tip.selectAll("*").remove();
                    }

                })
            .on('click', function(d){
                if (selected == -1){
                    selected=d3.select(this)
                }
                else {
                    selected.style('fill', function(d){
                                return selected.attr('id')
                             })
                             .style('stroke', function(d){
                                return selected.attr('id')
                            })
                    selected = -1
                    svg_tip.selectAll("*").remove();
                }
            })
            }
