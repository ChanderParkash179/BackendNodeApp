import { APIResponse } from "../utils/api.response.js"
import { async_handler } from "../utils/async.handler.js"


const healthcheck = async_handler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    return res
        .status(200)
        .json(new APIResponse(STATUS_CODE.OK, {}, "everything is working fine!")
        );
});

export {
    healthcheck
}