import moment from "moment";

export const toUTC = (date) =>
  date ? moment(date).utc().format("YYYY-MM-DDTHH:mm:ss[Z]") : null;

export const mergeDateAndTime = (date, time) => {
  if (!date || !time) return null;

  return moment(date)
    .set({
      hour: Number(time.hour),
      minute: 0,
      second: 0,
      millisecond: 0,
    })
    .toDate();
};

export const getNextFullHour = () =>
  moment().add(1, "hour").startOf("hour").toDate();