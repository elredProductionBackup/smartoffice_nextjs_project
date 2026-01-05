import api from "./axios";

export const getMembersList = ({
  networkClusterCode,
  start = 1,
  offset = 10,
  searchBy = "name",     // name | title
  filterBy = "member", // members | board
  searchKey = "",
}) => {
  return api.get("/smartOfficeGetMembersList", {
    params: {
      networkClusterCode,
      start,
      offset,
      searchBy,
      filterBy,
      searchKey,
    },
  });
};
