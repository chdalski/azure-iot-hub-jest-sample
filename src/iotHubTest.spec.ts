import { Registry } from "azure-iothub";
import { Client } from "azure-iot-device";
import { Amqp as DeviceTransport } from "azure-iot-device-amqp";
import { v4 as uuidv4 } from "uuid";
import { promisify } from "util";
import assert from "assert";

const AZURE_IOT_HUB_CONNECTION_STRING =
  process.env.AZURE_IOT_HUB_CONNECTION_STRING;
const AZURE_IOT_HUB_DEVICE1_CONNECTION_STRING =
  process.env.AZURE_IOT_HUB_DEVICE1_CONNECTION_STRING;
const AZURE_IOT_HUB_DEVICE2_CONNECTION_STRING =
  process.env.AZURE_IOT_HUB_DEVICE2_CONNECTION_STRING;

let registry: Registry;
let device1: Client;
let device2: Client;

beforeAll(async () => {
  assert(AZURE_IOT_HUB_CONNECTION_STRING);
  assert(AZURE_IOT_HUB_DEVICE1_CONNECTION_STRING);
  assert(AZURE_IOT_HUB_DEVICE2_CONNECTION_STRING);
  registry = Registry.fromConnectionString(AZURE_IOT_HUB_CONNECTION_STRING);
  device1 = Client.fromConnectionString(
    AZURE_IOT_HUB_DEVICE1_CONNECTION_STRING,
    DeviceTransport
  );
  device2 = Client.fromConnectionString(
    AZURE_IOT_HUB_DEVICE2_CONNECTION_STRING,
    DeviceTransport
  );
});

const updateDeviceTwinProperties = async (
  device: Client,
  properties: Object
) => {
  device.open();
  const twin = await device.getTwin();
  const updateProperties = promisify(twin.properties.reported.update);
  const result = await updateProperties(properties);
  device.close();
  return result;
};

const twinsByQueryFromIotHub = async (queryString: string) => {
  const query = registry.createQuery(queryString);
  const queryResponse = await query.nextAsTwin();
  return Promise.all(Array.from(queryResponse.result));
};

const waitForPropertyUpdate = async (ms = 600) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

describe("iot hub from property to query result timing failure", () => {
  it("sets properties on devices and checks the updated twins - without wait", async () => {
    const uuid1 = uuidv4();
    const uuid2 = uuidv4();
    await updateDeviceTwinProperties(device1, { withoutwait: uuid1 });
    await updateDeviceTwinProperties(device1, { withoutwait: uuid2 });
    const twins = await twinsByQueryFromIotHub(
      "SELECT * FROM devices WHERE IS_DEFINED(properties.reported.withoutwait)"
    );
    expect(twins.map((t) => t.properties.reported.withoutwait)).toEqual(
      expect.arrayContaining([uuid1, uuid2])
    );
  });

  it("sets properties on devices and checks the updated twins - with wait", async () => {
    const uuid1 = uuidv4();
    const uuid2 = uuidv4();
    await updateDeviceTwinProperties(device1, { withwait: uuid1 });
    await updateDeviceTwinProperties(device2, { withwait: uuid2 });
    await waitForPropertyUpdate(); // await for updated properties to be reflected in the query
    const twins = await twinsByQueryFromIotHub(
      "SELECT * FROM devices WHERE IS_DEFINED(properties.reported.withwait)"
    );
    expect(twins.map((t) => t.properties.reported.withwait)).toEqual(
      expect.arrayContaining([uuid1, uuid2])
    );
  });
});
