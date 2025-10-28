export function generateLogFileName(): string {
    const now = new Date();
    
    // Convert to Asia/Bangkok timezone
    const localTime = new Date(now.toLocaleString("en-US", {timeZone: 'Asia/Bangkok'}));
    
    const year = localTime.getFullYear();
    const month = String(localTime.getMonth() + 1).padStart(2, '0');
    const day = String(localTime.getDate()).padStart(2, '0');
    const hours = String(localTime.getHours()).padStart(2, '0');
    const minutes = String(localTime.getMinutes()).padStart(2, '0');
    const seconds = String(localTime.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    const timestamp = `${year}-${month}-${day}T${hours}-${minutes}-${seconds}.${milliseconds}+07-00`;
    
    return `${timestamp}.csv`;
}

