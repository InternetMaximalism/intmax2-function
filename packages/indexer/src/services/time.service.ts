export const getTime = () => {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();
  const milliSeconds = now.getUTCMilliseconds();

  const dateTime = now.toISOString();
  const date = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year}`;
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const dayOfWeek = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  return {
    year,
    month,
    day,
    hour,
    minute,
    seconds,
    milliSeconds,
    dateTime,
    date,
    time,
    timeZone: "UTC",
    dayOfWeek,
    dstActive: false,
  };
};
