module.exports = {
  adjustHistoryUpLimit: 3,                  // Limit of auto-adjust up (within hour) -- opposite if actual temp
  adjustHistoryDownLimit: 2,                // Limit of auto-adjusting down (within hour) -- opposite of actual temp
  adjustTempDelay: 20,                      // Minutes
  adjustTempDelayNormal: 10,                      // Minutes
  adjustTempHistoryLimit: 10,                // cycles to watch for exursions-ver (about every hour)
  adjustHistoryTimer: 1 * 60 * 60 * 1000,     // remove an adjustment history every hour
  debug: true,
  debugAdjust: false,
  defaultStartTime: '0:00',
  defaultDuration: 0,
  defaultTemp: 66,
  loopSeconds: 2 * 1000,
  timeFormat: 'HH:mm',
  defaultPlayDuration: '20',
  defaultPlayStartTime: '20:20',
  defaultSwitch1Duration: '120',
  defaultSwitch1StartTime: '16:30',
  tempMin: 60,                            // refuse to set lower
  tempMax: 80,                            // refuse to set higher
  timeStampBackUpMinutes: 5,
}
