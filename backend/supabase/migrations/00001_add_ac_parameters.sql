-- Migration 00001: Add AC Parameters Table

CREATE TABLE laporan_ac_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laporan_id UUID REFERENCES laporan(id) ON DELETE CASCADE,
    
    -- Voltase RST
    voltase_rs VARCHAR(50),
    voltase_rt VARCHAR(50),
    voltase_st VARCHAR(50),
    
    -- Ampere
    ampere_r VARCHAR(50),
    ampere_s VARCHAR(50),
    ampere_t VARCHAR(50),
    
    -- Kondisi
    suhu VARCHAR(50),
    tekanan_low VARCHAR(50),
    tekanan_high VARCHAR(50),
    
    -- Komponen Indoor
    indoor_pcb VARCHAR(100),
    indoor_motor_fan VARCHAR(100),
    indoor_sensor_thermist VARCHAR(100),
    indoor_vanbelt VARCHAR(100),
    
    -- Komponen Outdoor
    outdoor_kompressor VARCHAR(100),
    outdoor_protect_phase VARCHAR(100),
    outdoor_kontraktor VARCHAR(100),
    outdoor_motor_fan VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_laporan_ac
BEFORE UPDATE ON laporan_ac_parameters
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
