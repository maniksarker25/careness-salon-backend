import Service from "../modules/service/service.model";

const calculateTotalServiceTime = async (serviceIds:string[]) => {
    const services = await Service.find({ _id: { $in: serviceIds } });
    return services.reduce((total, service) => total + service.durationMinutes, 0);
  };



export default calculateTotalServiceTime;