import pandas as pd
import numpy as np
import requests
from requests.exceptions import HTTPError
from datetime import datetime
import time
import keys

class RefreshWeather:
    def __init__(self):
        self.zip_file_path='data/wa-zip-code.csv'
        self.raw_zips=self.generate_raw()
        self.key=keys.weather_key()
        self.columns_to_keep=['wind_speed','clouds','day','month','condition_main', 'condition_description',
                              'condition_icon','average_feel','expected_percipitation','pop']
        self.timer_lim = 50
        self.counter_lim = 50
        self.daily_weather=pd.DataFrame()
        self.update_weather()

    def generate_raw(self):
        '''
        reads in main zip code file and filters for WA
        '''
        temp=pd.read_csv(self.zip_file_path,dtype={'Zip':object})
        return temp

    def get_date_month(self, date):
        '''
        converts api dt response into day and month fields
        '''
        temp=datetime.fromtimestamp(date)
        return temp.day, temp.month

    def get_main_cond(self, condition):
        '''
        gets the main condition and returns main, description and icon
        '''
        if len(condition)==0:
            return 'N/A', 'N/A', 'N/A'
        else:
            temp=condition[0]
            return temp['main'], temp['description'], temp['icon']    
        
    def generate_weather_data_individual(self, raw, zip_code):
        '''
        takes raw response from api and turns it into dataframe, filters columns, adds new columns, renames and replaces nan 
        '''
        # read in data
        df=pd.json_normalize(raw['daily'])

        # create new columns
        df['day'],df['month']=np.vectorize(self.get_date_month)(df['dt'])
        df['condition_main'],df['condition_description'],df['condition_icon']=np.vectorize(self.get_main_cond)(df['weather'])

        # sometimes rain and snow columns are not included, default value is 0
        if 'rain' not in df.columns:
            df['rain']=0
        if 'snow' not in df.columns:
            df['snow']=0
        
        # sometimes the rain/snow/pop values for specific days are NaN so handling that now
        df['rain'] = df['rain'].fillna(0)
        df['snow'] = df['snow'].fillna(0)
        df['pop'] = df['pop'].fillna(0)
            
        df['average_feel']=(df['feels_like.morn']+df['feels_like.day']+df['feels_like.eve']+df['feels_like.night'])/4
        df['expected_percipitation']=np.minimum((df['rain']+df['snow'])*df['pop'], 12)
        df['pop']=df['pop']*100
        
        # filter columns
        df=df[self.columns_to_keep]
        
        # fill missing
        df.fillna(0,inplace=True)

        # rename columns
        df.rename(columns={x:x.replace('.','_') for x in df.columns if '.' in x})
        
        # add zip code to identify
        df['zip_code']=zip_code
        
        self.daily_weather=self.daily_weather.append(df, ignore_index=True)

    def make_request(self, lat, lon):
        '''
        makes requests
        '''
        exclude='current,minutely,hourly,alerts'
        url='https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&appid={key}&exclude={exclude}&units=imperial'
        url=url.format(lat=lat,lon=lon,key=self.key,exclude=exclude)

        try:
            response = requests.get(url)
            response.raise_for_status()
            jsonResponse = response.json()
            return jsonResponse
        except HTTPError as http_err:
            print(f'HTTP error occurred: {http_err}')
        except Exception as err:
            print(f'Other error occurred: {err}')

    def reset_api_time_check(self):
        '''
        resets the timer and counter used to ensure the program doesn't exceed api limit of openweathermap
        '''
        self.timer = time.time()
        self.counter = 1

    def update_weather(self):
        '''
        main loop that generates the weather for each zip code in WA. logic encoded to ensure that
        program does not exceed the api limit of openweathermap
        '''

        self.reset_api_time_check()

        for index, row in self.raw_zips.iterrows():
            time_elapsed = time.time() - self.timer

            if (time_elapsed >= self.timer_lim) and (self.counter < self.counter_lim):
                self.reset_api_time_check()
            elif self.counter >= self.counter_lim:
                time.sleep(self.timer_lim*1.25 - time_elapsed)
                self.reset_api_time_check()

            temp=self.make_request(row['Latitude'],row['Longitude'])
            self.generate_weather_data_individual(temp,row['Zip'])
            self.counter += 1
            print(row['zip'])

        self.daily_weather.to_csv('data/daily_weather.csv', index=False)

if __name__ == "__main__":
    RefreshWeather()