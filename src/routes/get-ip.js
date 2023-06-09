
export const basicRoutes = {
    path: '/api/get-ip',
    method: 'get',
    handler: async (req, res) => {
       res.send("hello world")
    }
}