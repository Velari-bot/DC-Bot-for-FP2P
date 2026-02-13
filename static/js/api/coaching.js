import { API_ROUTE, errorMessage } from "../utils/constants";

export const checkout = async (useMiddleware, productId = false, email = null, courseId = null, data = {}) => {
    let url = `${API_ROUTE}/stripe?action=checkout&productId=${productId}`;
    if (email) url += `&email=${encodeURIComponent(email)}`;
    if (courseId) url += `&courseId=${courseId}`;

    return await useMiddleware
        .post(url, data)
        .then((res) => res.data)
        .catch((err) => {
            console.log(err);
            return { error: true, message: errorMessage(err) };
        });
}