module.exports = {
  adjustHistoryUpLimit: 2,                // Limit of auto-adjust up (within hour)
  adjustHistoryDownLimit: 2,                // Limit of auto-adjusting down (within hour)
  adjustTempDelay: 15,                      // Minutes
  adjustTempDelayNormal: 6,                      // Minutes
  adjustTempHistoryLimit: 10,                // cycles to watch for exursions-ver (about every hour)
  debug: true,
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
