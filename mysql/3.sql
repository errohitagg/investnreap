insert into sectors (`name`, `created_at`, `updated_at`)
    values ('Financial Services', NOW(), NOW()),
        ('Pharma', NOW(), NOW()),
        ('Energy', NOW(), NOW()),
        ('IT', NOW(), NOW()),
        ('Consumer Goods', NOW(), NOW()),
        ('Automobile', NOW(), NOW()),
        ('Metals', NOW(), NOW()),
        ('Construction', NOW(), NOW()),
        ('Cement & Cement Products', NOW(), NOW()),
        ('Telecom', NOW(), NOW()),
        ('Services', NOW(), NOW()),
        ('Fertilizers & Pesticides', NOW(), NOW()),
        ('Media & Entertainment', NOW(), NOW()),
        ('Industrial Manufacturing', NOW(), NOW()),
        ('Chemicals', NOW(), NOW());
        
update companies
set sector_id = (select id from sectors where name = 'Financial Services')
where symbol in ('HDFCBANK', 'HDFC', 'ICICIBANK', 'AXISBANK', 'SBIN', 'KOTAKBANK', 'INDUSINDBK', 'BAJAJFINSV', 'YESBANK', 'BAJFINANCE', 'IBULHSGFIN', 'SRTRANSFIN', 'HDFCLIFE', 'LICHSGFIN', 'ICICIPRULI', 'GICRE', 'ICICIGI', 'BANKBARODA', 'L&TFH', 'NIACL', 'BANDHANBNK', 'ABCAPITAL', 'SBILIFE');

update companies
set sector_id = (select id from sectors where name = 'Energy')
where symbol in ('RELIANCE', 'NTPC', 'ONGC', 'POWERGRID', 'GAIL', 'IOC', 'BPCL', 'HINDPETRO', 'OIL', 'PETRONET', 'NHPC');

update companies
set sector_id = (select id from sectors where name = 'IT')
where symbol in ('INFY', 'TCS', 'HCLTECH', 'TECHM', 'WIPRO', 'OFSS');

update companies
set sector_id = (select id from sectors where name = 'Consumer Goods')
where symbol in ('ITC', 'ASIANPAINT', 'TITAN', 'HINDUNILVR', 'BRITANNIA', 'GODREJCP', 'DABUR', 'MCDOWELL-N', 'HAVELLS', 'MARICO', 'DMART', 'COLPAL', 'PGHH');

update companies
set sector_id = (select id from sectors where name = 'Automobile')
where symbol in ('MARUTI', 'M&M', 'TATAMOTORS', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT', 'MOTHERSUMI', 'BOSCHLTD', 'ASHOKLEY', 'MRF');

update companies
set sector_id = (select id from sectors where name = 'Construction')
where symbol in ('LT', 'DLF');

update companies
set sector_id = (select id from sectors where name = 'Metals')
where symbol in ('TATASTEEL', 'JSWSTEEL', 'VEDL', 'HINDALCO', 'COALINDIA', 'NMDC', 'SAIL', 'HINDZINC');

update companies
set sector_id = (select id from sectors where name = 'Pharma')
where symbol in ('SUNPHARMA', 'DRREDDY', 'CIPLA', 'LUPIN', 'PEL', 'BIOCON', 'AUROPHARMA', 'CADILAHC');

update companies
set sector_id = (select id from sectors where name = 'Cement & Cement Products')
where symbol in ('GRASIM', 'ULTRACEMCO', 'SHREECEM', 'ACC', 'AMBUJACEM');

update companies
set sector_id = (select id from sectors where name = 'Services')
where symbol in ('ADANIPORTS', 'INDIGO', 'CONCOR');

update companies
set sector_id = (select id from sectors where name = 'Telecom')
where symbol in ('INFRATEL', 'BHARTIARTL', 'IDEA');

update companies
set sector_id = (select id from sectors where name = 'Fertilizers & Pesticides')
where symbol in ('UPL');

update companies
set sector_id = (select id from sectors where name = 'Media & Entertainment')
where symbol in ('ZEEL', 'SUNTV');

update companies
set sector_id = (select id from sectors where name = 'Industrial Manufacturing')
where symbol in ('BHEL', 'SIEMENS', 'ABB', 'BEL');

update companies
set sector_id = (select id from sectors where name = 'Chemicals')
where symbol in ('PIDILITIND');
