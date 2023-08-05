import axios from 'axios';
import toast from 'react-hot-toast';

import type { OneNonRankedResponseSuccess } from './shared/types';

export const getOneNoneRanked = (
  fn: (respData: OneNonRankedResponseSuccess) => void
): void => {
  // Get one non ranked pic
  axios
    .get<OneNonRankedResponseSuccess>('/api/v1/one-non-ranked')
    .then(function (response) {
      fn(response.data);
      console.log('/api/v1/one-non-ranked return:');
      console.log(response.data);
    })
    .catch(function (error) {
      toast.error(error.response.data.error);
      console.log(error);
    });
};
