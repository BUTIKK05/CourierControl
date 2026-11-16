
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const initialCouriers = [
  { id: 1, name: "Александр", status: "На линии", lat: 53.9006, lng: 27.5590 },
  { id: 2, name: "Дмитрий", status: "На линии", lat: 53.9145, lng: 27.5750 },
  { id: 3, name: "Максим", status: "Свободен", lat: 53.8870, lng: 27.5400 },
];

const initialOrders = [
  { id: 101, address: "пр. Независимости, 25", lat: 53.9023, lng: 27.5618, status: "Новый" },
  { id: 102, address: "ул. Ленина, 10", lat: 53.8965, lng: 27.5540, status: "Новый" },
  { id: 103, address: "ул. Сурганова, 15", lat: 53.9210, lng: 27.5900, status: "Назначен" },
];

function makeIcon(emoji, className) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="${className}">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

const courierIcon = makeIcon("🛵", "map-marker courier-marker");
const orderIcon = makeIcon("📦", "map-marker order-marker");

export default function App() {
  const [couriers, setCouriers] = useState(initialCouriers);
  const [orders, setOrders] = useState(initialOrders);
  const [selected, setSelected] = useState(null);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [city, setCity] = useState("Минск");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderComment, setOrderComment] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [priority, setPriority] = useState("Обычный");
  const [addressResults, setAddressResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [editingOrder, setEditingOrder] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const selectedOrder =
  selected?.type === "order"
    ? orders.find((order) => order.id === selected.id)
    : null;

    function startEditingOrder() {
  if (!selectedOrder) return;

  setEditForm({
    customerName: selectedOrder.customerName || "",
    customerPhone: selectedOrder.customerPhone || "",
    address: selectedOrder.address || "",
    comment: selectedOrder.comment || "",
    deliveryTime: selectedOrder.deliveryTime || "",
    priority: selectedOrder.priority || "Обычный",
    status: selectedOrder.status || "Новый",
  });

  setEditingOrder(true);
}

function saveEditedOrder() {
  if (!editForm || !selectedOrder) return;

  setOrders((items) =>
    items.map((order) =>
      order.id === selectedOrder.id
        ? {
            ...order,
            customerName: editForm.customerName.trim(),
            customerPhone: editForm.customerPhone.trim(),
            address: editForm.address.trim(),
            comment: editForm.comment.trim(),
            deliveryTime: editForm.deliveryTime,
            priority: editForm.priority,
            status: editForm.status,
          }
        : order
    )
  );

  setEditingOrder(false);
  setEditForm(null);
}


  function addCourier() {
    const name = prompt("Введите имя курьера:");
    if (!name?.trim()) return;

    setCouriers((items) => [
      ...items,
      {
        id: Date.now(),
        name: name.trim(),
        status: "Свободен",
        lat: 53.9006 + (Math.random() - 0.5) * 0.04,
        lng: 27.5590 + (Math.random() - 0.5) * 0.04,
      },
    ]);
  }

  

async function searchAddress() {
  if (!city.trim() || !street.trim() || !house.trim()) {
    setAddressError("Заполните город, улицу и номер дома.");
    return;
  }

  setSearchingAddress(true);
  setAddressError("");
  setAddressResults([]);
  setSelectedAddress(null);

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      limit: "5",
      countrycodes: "by",
      q: `${street}, ${house}, ${city}, Беларусь`,
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`
    );

    if (!response.ok) {
      throw new Error("Ошибка поиска адреса");
    }

    const results = await response.json();

    if (results.length === 0) {
      setAddressError("Адрес не найден. Проверьте написание.");
    } else {
      setAddressResults(results);
    }
  } catch (error) {
    console.error(error);
    setAddressError("Не удалось выполнить поиск. Проверьте интернет.");
  } finally {
    setSearchingAddress(false);
  }
}

function confirmOrder() {
  if (!selectedAddress) {
    setAddressError("Сначала выберите найденный адрес.");
    return;
  }

  const newId =
    Math.max(100, ...orders.map((order) => Number(order.id) || 0)) + 1;

  const newOrder = {
  id: newId,
  address: selectedAddress.display_name,
  customerName: customerName.trim(),
  customerPhone: customerPhone.trim(),
  comment: orderComment.trim(),
  deliveryTime: deliveryTime,
  priority: priority,
  status: "Новый",
  lat: Number(selectedAddress.lat),
  lng: Number(selectedAddress.lon),
};

  setOrders((items) => [...items, newOrder]);
  setOrderFormOpen(false);
  setAddressResults([]);
  setSelectedAddress(null);
  setStreet("");
  setHouse("");setCustomerName("");
setCustomerPhone("");
setOrderComment("");
setDeliveryTime("");
setPriority("Обычный");
  setAddressError("");
}



  function deleteCourier(id) {
    setCouriers((items) => items.filter((item) => item.id !== id));
    if (selected?.type === "courier" && selected.id === id) setSelected(null);
  }

  function deleteOrder(id) {
    setOrders((items) => items.filter((item) => item.id !== id));
    if (selected?.type === "order" && selected.id === id) setSelected(null);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">CC</span>
          <div>
            <strong>Courier Control</strong>
            <small>Система управления доставкой</small>
          </div>
        </div>
        <div className="connection"><span /> Система работает</div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="section-heading">
            <div>
              <h2>Курьеры</h2>
              <small>{couriers.length} человек</small>
            </div>
            <button className="add-button" onClick={() => setOrderFormOpen(true)}>
              + Добавить
              </button>
          </div>

          <div className="items-list">
            {couriers.map((courier) => (
              <div
                className={`item ${selected?.id === courier.id && selected?.type === "courier" ? "selected" : ""}`}
                key={courier.id}
                onClick={() => setSelected({ type: "courier", id: courier.id, title: courier.name })}
              >
                <div className="item-icon courier-bg">🛵</div>
                <div className="item-info">
                  <strong>{courier.name}</strong>
                  <small><span className="status-dot" />{courier.status}</small>
                </div>
                <button className="delete-button" title="Удалить" onClick={(e) => { e.stopPropagation(); deleteCourier(courier.id); }}>×</button>
              </div>
            ))}
            {couriers.length === 0 && <p className="empty">Курьеров пока нет</p>}
          </div>

          <div className="section-heading orders-heading">
            <div>
              <h2>Заказы</h2>
              <small>{orders.length} заказов</small>
            </div>
            <button
             className="add-button"
             onClick={() => setOrderFormOpen(true)}
            >
              + Добавить
            </button>
          </div>

          <div className="items-list">
            {orders.map((order) => (
              <div
                className={`item ${selected?.id === order.id && selected?.type === "order" ? "selected" : ""}`}
                key={order.id}
                onClick={() => setSelected({ type: "order", id: order.id, title: `Заказ №${order.id}` })}
              >
                <div className="item-icon order-bg">📦</div>
                <div className="item-info">
                  <strong>Заказ №{order.id}</strong>

<small>{order.address}</small>

{order.customerName && (
  <small>👤 {order.customerName}</small>
)}

{order.customerPhone && (
  <small>📞 {order.customerPhone}</small>
)}

{order.priority === "Срочный" && (
  <small className="order-status">🔴 Срочный заказ</small>
)}

<small className="order-status">{order.status}</small>
                </div>
                <button className="delete-button" title="Удалить" onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}>×</button>
              </div>
            ))}
            {orders.length === 0 && <p className="empty">Заказов пока нет</p>}
          </div>

          <div className="optimization-box">
            <strong>Оптимизация маршрутов</strong>
            <p>Автоматическое распределение заказов подключим на следующем этапе.</p>
            <button disabled>Оптимизировать маршруты</button>
          </div>
        </aside>

        <section className="map-area">
          <div className="map-heading">
            <div>
              <h2>Карта доставки</h2>
              <small>Минск, Беларусь · Тестовые данные</small>
            </div>
            <div className="map-legend">
              <span>🛵 Курьеры</span>
              <span>📦 Заказы</span>
            </div>
          </div>

          <MapContainer center={[53.9006, 27.5590]} zoom={13} className="map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {couriers.map((courier) => (
              <Marker
                key={courier.id}
                position={[courier.lat, courier.lng]}
                icon={courierIcon}
                eventHandlers={{ click: () => setSelected({ type: "courier", id: courier.id, title: courier.name }) }}
              >
                <Popup>Курьер: {courier.name}<br />Статус: {courier.status}</Popup>
              </Marker>
            ))}
            {orders.map((order) => (
              <Marker
                key={order.id}
                position={[order.lat, order.lng]}
                icon={orderIcon}
                eventHandlers={{ click: () => setSelected({ type: "order", id: order.id, title: `Заказ №${order.id}` }) }}
              >
                <Popup>Заказ №{order.id}<br />{order.address}</Popup>
              </Marker>
            ))}
          </MapContainer>

          
{selected && (
  <div className="selection-card">
    <button onClick={() => {
      setSelected(null);
      setEditingOrder(false);
      setEditForm(null);
    }}>×</button>

    {selected.type === "order" && selectedOrder ? (
      <>
        {editingOrder && editForm ? (
          <>
            <h3>Редактирование заказа №{selectedOrder.id}</h3>

            <div className="order-details">
              <label>Имя получателя</label>
              <input
                value={editForm.customerName}
                onChange={(e) => setEditForm({
                  ...editForm,
                  customerName: e.target.value
                })}
              />

              <label>Телефон</label>
              <input
                type="tel"
                value={editForm.customerPhone}
                onChange={(e) => setEditForm({
                  ...editForm,
                  customerPhone: e.target.value
                })}
              />

              <label>Адрес доставки</label>
              <textarea
                value={editForm.address}
                readOnly
              />
              <small>Изменение адреса с обновлением координат добавим отдельно.</small>

              <label>Комментарий</label>
              <textarea
                value={editForm.comment}
                onChange={(e) => setEditForm({
                  ...editForm,
                  comment: e.target.value
                })}
              />

              <label>Время доставки</label>
              <input
                type="datetime-local"
                value={editForm.deliveryTime}
                onChange={(e) => setEditForm({
                  ...editForm,
                  deliveryTime: e.target.value
                })}
              />

              <label>Приоритет</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({
                  ...editForm,
                  priority: e.target.value
                })}
              >
                <option value="Обычный">Обычный</option>
                <option value="Срочный">Срочный</option>
              </select>

              <label>Статус заказа</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({
                  ...editForm,
                  status: e.target.value
                })}
              >
                <option value="Новый">Новый</option>
                <option value="Назначен">Назначен</option>
                <option value="В пути">В пути</option>
                <option value="Доставлен">Доставлен</option>
                <option value="Отменён">Отменён</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setEditingOrder(false);
                  setEditForm(null);
                }}
              >
                Отмена
              </button>

              <button
                className="confirm-button"
                onClick={saveEditedOrder}
              >
                Сохранить
              </button>
            </div>
          </>
        ) : (
          <>
            <small>Подробности заказа</small>
            <h3>Заказ №{selectedOrder.id}</h3>

            <div className="order-details">
              <p>👤 <strong>Получатель:</strong> {selectedOrder.customerName || "Не указан"}</p>
              <p>📞 <strong>Телефон:</strong> {selectedOrder.customerPhone || "Не указан"}</p>
              <p>📍 <strong>Адрес:</strong> {selectedOrder.address}</p>
              <p>💬 <strong>Комментарий:</strong> {selectedOrder.comment || "Нет комментария"}</p>
              <p>🕒 <strong>Доставка:</strong> {selectedOrder.deliveryTime
                ? new Date(selectedOrder.deliveryTime).toLocaleString("ru-RU")
                : "Время не указано"}</p>
              <p>⚡ <strong>Приоритет:</strong> {selectedOrder.priority || "Обычный"}</p>
              <p>📦 <strong>Статус:</strong> {selectedOrder.status}</p>
            </div>

            <button
              className="confirm-button"
              onClick={startEditingOrder}
            >
              ✏️ Редактировать заказ
            </button>
          </>
        )}
      </>
    ) : (
      <>
        <small>Выбран объект</small>
        <strong>{selected.title}</strong>
        <span>Курьер</span>
      </>
    )}
  </div>
)}

        </section>
      </main>
      {orderFormOpen && (
        <div className="modal-overlay">
          <div className="order-modal">
            <h2>Новый заказ</h2>
            <p>Укажите адрес доставки</p><div className="form-divider">Информация о получателе</div>

<label>Имя и фамилия</label>
<input
  value={customerName}
  onChange={(e) => setCustomerName(e.target.value)}
  placeholder="Например, Иван Иванов"
/>

<label>Номер телефона</label>
<input
  type="tel"
  value={customerPhone}
  onChange={(e) => setCustomerPhone(e.target.value)}
  placeholder="+375 29 123-45-67"
/>

<label>Комментарий для курьера</label>
<textarea
  value={orderComment}
  onChange={(e) => setOrderComment(e.target.value)}
  placeholder="Например, позвонить за 10 минут до доставки"
/>

<label>Желаемое время доставки</label>
<input
  type="datetime-local"
  value={deliveryTime}
  onChange={(e) => setDeliveryTime(e.target.value)}
/>

<label>Приоритет заказа</label>
<select
  value={priority}
  onChange={(e) => setPriority(e.target.value)}
>
  <option value="Обычный">Обычный</option>
  <option value="Срочный">Срочный</option>
</select>

<div className="form-divider">Адрес доставки</div>
            <label>Город</label>
            <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Минск"
            />
            <label>Улица</label>
            <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Например, проспект Независимости"
            />
            <label>Номер дома</label>
            <input
            value={house}
            onChange={(e) => setHouse(e.target.value)}
            placeholder="Например, 10"
            />
            
            <button
            className="search-address-button"
            onClick={searchAddress}
            disabled={searchingAddress}
            >
              {searchingAddress ? "Ищем адрес..." : "Найти адрес"}
              </button>
              {addressError && (
                <p className="address-error">{addressError}</p>
                )}
                
                {addressResults.length > 0 && (
                  <div className="address-results">
                    <strong>Выберите подходящий адрес:</strong>
                    
                    {addressResults.map((result, index) => (
                      <button
                      key={result.place_id}
                      className={
                        selectedAddress?.place_id === result.place_id
                        ? "address-option active"
                        : "address-option"
                      }
                      onClick={() => setSelectedAddress(result)}
                      >
                        {result.display_name}
                        </button>
                      ))}
                      </div>
                    )}
                    
                    {selectedAddress && (
                      <p className="selected-address">
                        Выбран адрес: {selectedAddress.display_name}
                        </p>
                      )}
                      
                      <div className="modal-actions">
                        <button
                        className="cancel-button"
                        onClick={() => {
                          setOrderFormOpen(false);
                          setAddressError("");
                        }}
                        >
                          Отмена
                          </button>
                          
                          <button
                          className="confirm-button"
                          onClick={confirmOrder}
                          disabled={!selectedAddress}
                          >
                            Создать заказ
                            </button>
                            </div>
                            </div>
                            </div>
                          )}      
                          
      </div>
  );
}
